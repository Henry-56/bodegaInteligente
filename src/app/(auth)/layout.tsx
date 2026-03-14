export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-mesh px-4 overflow-hidden">
      {/* Decorative blurred circles for extra depth */}
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-pink-600/20 blur-[120px]" />
      
      <div className="relative w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
