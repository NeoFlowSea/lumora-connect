/* Forgot password, reset password and email confirmation screens. Owned by the auth agent (dict: auth). */
export function ForgotScreen() {
  return <div className="min-h-[100svh] bg-paper p-10">Forgot password</div>;
}
export function ResetScreen({ token }: { token: string }) {
  return <div className="min-h-[100svh] bg-paper p-10">Reset {token}</div>;
}
export function ConfirmScreen({ token }: { token: string }) {
  return <div className="min-h-[100svh] bg-paper p-10">Confirm {token}</div>;
}
