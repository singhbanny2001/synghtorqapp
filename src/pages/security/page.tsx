import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InternalPageHeader from '@/components/InternalPageHeader';

type SecuritySession = {
  id: string;
  user: string;
  source: string;
  device: string;
  ip: string;
  version: string;
  lastSeen: string;
};

const securitySessions: SecuritySession[] = [
  {
    id: 's1',
    user: 'JAY-R JACOB',
    source: 'Web',
    device: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
    ip: '169.254.169.126',
    version: '-',
    lastSeen: '1h 34m ago',
  },
  {
    id: 's2',
    user: 'Amery',
    source: 'iOS',
    device: 'unknownIphone OS',
    ip: '35.191.134.36',
    version: '',
    lastSeen: '18d 19h 19m ago',
  },
  {
    id: 's3',
    user: 'Training 1',
    source: 'iOS',
    device: 'iphone_11 OS',
    ip: '35.191.119.124',
    version: '',
    lastSeen: '46d 22h 37m ago',
  },
  {
    id: 's4',
    user: 'Jay',
    source: 'ANDROID',
    device: 'ALI-NX1 OS 13',
    ip: '35.191.34.232',
    version: '308',
    lastSeen: '1h 29m ago',
  },
  {
    id: 's5',
    user: 'Irish Maguera',
    source: 'iOS',
    device: 'unknownIphone OS',
    ip: '35.191.34.232',
    version: '',
    lastSeen: '20d 19h 12m ago',
  },
  {
    id: 's6',
    user: 'Jay',
    source: 'iOS',
    device: 'unknownIphone OS',
    ip: '35.191.34.96',
    version: '',
    lastSeen: '2d 13h 4m ago',
  },
  {
    id: 's7',
    user: 'Banny',
    source: 'iOS',
    device: 'unknownIphone OS',
    ip: '35.191.97.165',
    version: '',
    lastSeen: '14h 59m ago',
  },
  {
    id: 's8',
    user: 'Demo User',
    source: 'iOS',
    device: 'unknownIphone OS',
    ip: '35.191.21.25',
    version: '',
    lastSeen: '27d 11h 42m ago',
  },
  {
    id: 's9',
    user: 'RonnieI Rumpe',
    source: 'ANDROID',
    device: 'ALT-LX2 OS 14',
    ip: '35.191.126.186',
    version: '308',
    lastSeen: '2d 22h 21m ago',
  },
  {
    id: 's10',
    user: 'tecarcie',
    source: 'ANDROID',
    device: 'BRP-NX1 OS 16',
    ip: '35.191.35.51',
    version: '308',
    lastSeen: '4d 17h 35m ago',
  },
  {
    id: 's11',
    user: 'tecrom',
    source: 'ANDROID',
    device: 'ALT-LX2 OS 14',
    ip: '35.191.138.109',
    version: '308',
    lastSeen: '3h 3m ago',
  },
  {
    id: 's12',
    user: 'tecrom',
    source: 'ANDROID',
    device: 'SM-T295 OS 10',
    ip: '35.191.87.59',
    version: '308',
    lastSeen: '53d 19h 53m ago',
  },
  {
    id: 's13',
    user: 'tecrom',
    source: 'ANDROID',
    device: 'Infinix X6835B OS 13',
    ip: '35.191.35.186',
    version: '308',
    lastSeen: '5d 14h 46m ago',
  },
  {
    id: 's14',
    user: 'Francis Obo',
    source: 'ANDROID',
    device: 'LLY-LX2 OS 14',
    ip: '35.191.19.22',
    version: '308',
    lastSeen: '5d 17h 51m ago',
  },
  {
    id: 's15',
    user: 'tecrom',
    source: 'ANDROID',
    device: 'ALT-LX2 OS 14',
    ip: '35.191.89.72',
    version: '308',
    lastSeen: '90d 21h 51m ago',
  },
  {
    id: 's16',
    user: 'Banny',
    source: 'ANDROID',
    device: 'SM-S928B OS 16',
    ip: '35.191.34.48',
    version: '309',
    lastSeen: '19h 36m ago',
  },
];

export default function Security() {
  const navigate = useNavigate();
  const [selectedSearchUser, setSelectedSearchUser] = useState('');
  const [appliedSearchUser, setAppliedSearchUser] = useState('');

  const filteredSessions = useMemo(() => {
    const query = appliedSearchUser.trim().toLowerCase();
    if (!query) return securitySessions;

    return securitySessions.filter((session) =>
      [session.user, session.source, session.device, session.ip, session.version, session.lastSeen]
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [appliedSearchUser]);

  const handleSearch = () => {
    setAppliedSearchUser(selectedSearchUser);
  };

  return (
    <div className="min-h-full bg-white pb-24 text-slate-950 dark:bg-slate-950 dark:text-white">
      <InternalPageHeader
        title="Security"
        subtitle="Logged in devices"
        onBack={() => navigate('/more?settings=1')}
      />

      <div className="px-1.5 pt-2">
        <div className="rounded-sm bg-white dark:bg-slate-950">
          <div className="mb-2 flex items-center gap-1.5">
            <div className="relative w-[96px]">
              <select
                value={selectedSearchUser}
                onChange={(event) => setSelectedSearchUser(event.target.value)}
                className="h-6 w-full rounded-none border border-slate-200 bg-white px-1.5 text-[8px] font-medium text-slate-500 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500"
              >
                <option value="">Search by User</option>
                {[...new Set(securitySessions.map((session) => session.user))].map((userName) => (
                  <option key={userName} value={userName}>{userName}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="h-6 rounded-none border border-slate-200 bg-white px-2 text-[8px] font-semibold text-slate-700 btn-press dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <i className="ph ph-magnifying-glass mr-1 text-[8px]" />
              Search
            </button>
          </div>

          <div className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="space-y-2 py-2 sm:hidden">
              {filteredSessions.map((session, index) => (
                <div key={session.id} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold leading-tight text-slate-950 dark:text-white">{index + 1}. {session.user}</p>
                      <p className="text-[9px] font-semibold leading-tight text-slate-500 dark:text-slate-300">{session.source} · {session.lastSeen}</p>
                    </div>
                    <span className="rounded border border-slate-200 px-1.5 py-0.5 text-[8px] font-bold text-slate-600 dark:border-slate-700 dark:text-slate-200">
                      v{session.version || '-'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Device</p>
                      <p className="text-[9px] font-medium leading-snug text-slate-800 [overflow-wrap:anywhere] dark:text-slate-100">{session.device}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">IP</p>
                        <p className="font-mono text-[9px] font-medium leading-snug text-slate-800 [overflow-wrap:anywhere] dark:text-slate-100">{session.ip}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Version</p>
                        <p className="text-[9px] font-medium leading-snug text-slate-800 dark:text-slate-100">{session.version || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredSessions.length === 0 && (
                <div className="px-2 py-6 text-center text-[9px] font-semibold text-slate-500 dark:text-slate-300">
                  No logged in devices found.
                </div>
              )}
            </div>

            <div className="hidden w-full sm:block">
              <table className="w-full table-fixed border-collapse bg-white text-left dark:bg-slate-950">
                <colgroup>
                  <col className="w-[4%]" />
                  <col className="w-[12%]" />
                  <col className="w-[8%]" />
                  <col className="w-[44%]" />
                  <col className="w-[14%]" />
                  <col className="w-[7%]" />
                  <col className="w-[11%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                    <th className="px-0.5 py-1 text-[5.5px] font-bold leading-none text-slate-800 dark:text-white">#</th>
                    <th className="px-0.5 py-1 text-[5.5px] font-bold leading-none text-slate-800 dark:text-white">User</th>
                    <th className="px-0.5 py-1 text-[5.5px] font-bold leading-none text-slate-800 dark:text-white">Source</th>
                    <th className="px-0.5 py-1 text-[5.5px] font-bold leading-none text-slate-800 dark:text-white">Device</th>
                    <th className="px-0.5 py-1 text-[5.5px] font-bold leading-none text-slate-800 dark:text-white">IP</th>
                    <th className="px-0.5 py-1 text-[5.5px] font-bold leading-none text-slate-800 dark:text-white">Version</th>
                    <th className="px-0.5 py-1 text-[5.5px] font-bold leading-none text-slate-800 dark:text-white">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session, index) => (
                    <tr key={session.id} className="border-b border-slate-100 align-top last:border-b-0 dark:border-slate-800">
                      <td className="px-0.5 py-1 text-[5.2px] font-medium leading-tight text-slate-700 dark:text-slate-200">{index + 1}</td>
                      <td className="px-0.5 py-1 text-[5.2px] font-medium leading-tight text-slate-900 [overflow-wrap:anywhere] dark:text-white">{session.user}</td>
                      <td className="px-0.5 py-1 text-[5.2px] font-medium leading-tight text-slate-700 [overflow-wrap:anywhere] dark:text-slate-200">
                        {session.source}
                      </td>
                      <td className="px-0.5 py-1 text-[5px] font-medium leading-tight text-slate-700 [overflow-wrap:anywhere] dark:text-slate-200">{session.device}</td>
                      <td className="px-0.5 py-1 font-mono text-[4.8px] leading-tight text-slate-700 [overflow-wrap:anywhere] dark:text-slate-200">{session.ip}</td>
                      <td className="px-0.5 py-1 text-[5px] font-medium leading-tight text-slate-700 [overflow-wrap:anywhere] dark:text-slate-200">{session.version}</td>
                      <td className="px-0.5 py-1 text-[5px] font-medium leading-tight text-slate-700 [overflow-wrap:anywhere] dark:text-slate-200">{session.lastSeen}</td>
                    </tr>
                  ))}
                  {filteredSessions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-2 py-6 text-center text-[9px] font-semibold text-slate-500 dark:text-slate-300">
                        No logged in devices found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
