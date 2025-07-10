import { LoginForm } from "@components/components/login-form"

export default function Page() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-white dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
