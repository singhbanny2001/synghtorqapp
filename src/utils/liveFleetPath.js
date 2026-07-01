export const LIVE_FLEET_SELECTS = {
  devices: '*',
  vehicles: '*',
  drivers: '*',
  latestVehicleState: 'id,company_id,vehicle_id,device_id,driver_id,latitude,longitude,speed,heading,ignition,status,last_update,device_online,battery_voltage,external_voltage,fuel_liters,ac_status,door_status,gsm_signal,updated_at,imei,status_since,gps_battery_percent,gps_battery_voltage',
  gpsPositions: 'device_id,vehicle_id,device_timestamp,odometer,fuel_liters,latitude,longitude,speed,heading,ignition,movement,battery_voltage,external_voltage,gsm_signal,imei,event_time,gps_battery_percent,gps_battery_voltage',
};

export async function loadScopedLiveTrackingRows(supabase) {
  const { data, error } = await supabase.rpc('get_scoped_live_tracking');
  if (error || !Array.isArray(data)) return null;
  return data;
}

export async function resolveLiveCompanyId(supabase) {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData?.session?.user ?? null;
  const { data: authData, error: authError } = sessionUser
    ? { data: { user: sessionUser }, error: null }
    : await supabase.auth.getUser();
  if (authError || !authData?.user) return null;

  const { data: profileByAuthUser, error: profileAuthUserError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authData.user.id)
    .maybeSingle();

  const { data: profileByEmail, error: profileEmailError } = !profileByAuthUser && authData.user.email
    ? await supabase
        .from('users')
        .select('id')
        .eq('email', authData.user.email)
        .maybeSingle()
    : { data: null, error: null };

  if (profileAuthUserError && profileAuthUserError.message) {
    globalThis.console?.warn?.('[LiveFleet] profile lookup by auth_user_id failed:', profileAuthUserError.message);
  }
  if (profileEmailError && profileEmailError.message) {
    globalThis.console?.warn?.('[LiveFleet] profile lookup by email failed:', profileEmailError.message);
  }

  const profile = profileByAuthUser || profileByEmail;
  if (!profile?.id) return null;

  const [companyUsersResp, employeeLinksResp] = await Promise.all([
    supabase.from('company_users').select('company_id, role, status').eq('user_id', profile.id).order('created_at', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('employee_user_links').select('company_id, employee_id, status').eq('user_id', profile.id).order('created_at', { ascending: true }).limit(1).maybeSingle(),
  ]);

  const companyId = companyUsersResp.data?.company_id ?? employeeLinksResp.data?.company_id ?? null;
  if (companyId) return companyId;

  return null;
}

export async function loadLiveFleetRows(supabase, companyId = null) {
  const scopeToCompany = (query) => (companyId ? query.eq('company_id', companyId) : query);

  const [devicesResp, vehiclesResp, driversResp, statesResp] = await Promise.all([
    scopeToCompany(supabase.from('devices').select(LIVE_FLEET_SELECTS.devices)).order('created_at', { ascending: true }),
    scopeToCompany(supabase.from('vehicles').select(LIVE_FLEET_SELECTS.vehicles)).order('created_at', { ascending: true }),
    scopeToCompany(supabase.from('drivers').select(LIVE_FLEET_SELECTS.drivers)).order('created_at', { ascending: true }),
    scopeToCompany(supabase.from('latest_vehicle_state').select(LIVE_FLEET_SELECTS.latestVehicleState)).order('last_update', { ascending: false }),
  ]);

  if (devicesResp.error) throw devicesResp.error;
  if (vehiclesResp.error) throw vehiclesResp.error;
  if (driversResp.error) throw driversResp.error;
  if (statesResp.error) throw statesResp.error;

  return {
    companyId,
    devices: devicesResp.data ?? [],
    vehicles: vehiclesResp.data ?? [],
    drivers: driversResp.data ?? [],
    states: statesResp.data ?? [],
  };
}

export async function loadLatestGpsSnapshot(supabase, state) {
  if (!state?.device_id || !state?.last_update) return null;

  const { data, error } = await supabase
    .from('gps_positions')
    .select(LIVE_FLEET_SELECTS.gpsPositions)
    .eq('device_id', state.device_id)
    .eq('device_timestamp', state.last_update)
    .limit(1);

  if (error) return null;
  return data?.[0] ?? null;
}

export async function loadPlaybackTrail(supabase, vehicleId, deviceId) {
  const query = supabase
    .from('gps_positions')
    .select('device_id,vehicle_id,device_timestamp,latitude,longitude,speed,heading,ignition,odometer,fuel_liters')
    .order('device_timestamp', { ascending: true })
    .limit(300);

  const { data, error } = deviceId
    ? await query.eq('device_id', deviceId)
    : await query.eq('vehicle_id', vehicleId);

  if (error || !data) return [];

  const classifyPlaybackStatus = (speed, ignition) => {
    if (speed > 3) return 'moving';
    if (speed <= 3 && ignition) return 'idle';
    return 'stopped';
  };

  return data
    .filter((row) => Number.isFinite(Number(row.latitude)) && Number.isFinite(Number(row.longitude)))
    .map((row) => {
      const speed = Number(row.speed ?? 0);
      const ignition = Boolean(row.ignition);
      return {
        lat: Number(row.latitude),
        lng: Number(row.longitude),
        timestamp: row.device_timestamp || '',
        speed,
        status: classifyPlaybackStatus(speed, ignition),
        ignition,
        heading: Number(row.heading ?? 0),
        odometer: Number(row.odometer ?? 0),
        fuelLevel: Number(row.fuel_liters ?? 0),
      };
    });
}
