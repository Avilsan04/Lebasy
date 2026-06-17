import logoUrl from '../assets/lebasy-logo.png';

export function Logo({ className = '', label = 'Lebasy' }) {
  return <img className={`lebasy-logo ${className}`.trim()} src={logoUrl} alt={label} />;
}
