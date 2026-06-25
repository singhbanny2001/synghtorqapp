interface ReferenceVehicleIconProps {
  size?: 'list' | 'picker' | 'preview';
}

const sizeClass = {
  list: 'reference-vehicle-icon-list',
  picker: 'reference-vehicle-icon-picker',
  preview: 'reference-vehicle-icon-preview',
};

export default function ReferenceVehicleIcon({ size = 'list' }: ReferenceVehicleIconProps) {
  return (
    <div className={`reference-vehicle-icon ${sizeClass[size]}`} aria-hidden="true">
      <img src="/reference-vehicle-cutout.png" alt="" />
    </div>
  );
}
