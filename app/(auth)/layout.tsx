export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 인증 페이지들은 Navbar가 숨겨지므로 pt-16 보정 없이 전체 화면 사용
  return (
    <div className="-mt-16">
      {children}
    </div>
  )
}
