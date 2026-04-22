export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="auth-scope min-h-screen bg-[#faf9f7] text-zinc-900"
      style={{ colorScheme: "light" }}
    >
      {children}
    </div>
  );
}
