interface FaucetLinkProps {
  href: string;
  mobile?: boolean;
  onNavigate?: () => void;
}

/** Wallet-independent navigation to the external test-token service. */
export function FaucetLink({ href, mobile = false, onNavigate }: FaucetLinkProps) {
  if (mobile) {
    return (
      <a
        href={href}
        onClick={onNavigate}
        style={{
          display: 'block',
          textDecoration: 'none',
          textAlign: 'left',
          padding: '12px 14px',
          borderRadius: 12,
          fontFamily: 'var(--font-ui)',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--ink)',
        }}
      >
        Faucet
      </a>
    );
  }

  return <a className="zs-nav-tab" href={href}>Faucet</a>;
}
