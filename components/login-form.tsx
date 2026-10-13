"use client";

import { useActionState, useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  Copy,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { loginAction } from "@/app/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("hr@vinamilk.demo");
  const [password, setPassword] = useState("Demo@123");
  const [recoveryHelp, setRecoveryHelp] = useState(false);
  const [remember, setRemember] = useState(false);

  async function copyDemoPassword() {
    await navigator.clipboard.writeText("Demo@123");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <form action={action} className="login-form">
      {state?.error && <div className="login-error" role="alert">{state.error}</div>}

      <div className="login-field">
        <label htmlFor="email">Email công việc</label>
        <div className="login-input-wrap">
          <Mail aria-hidden="true" className="login-input-icon" />
          <input id="email" name="email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="username" required disabled={pending} />
        </div>
      </div>

      <div className="login-field">
        <label htmlFor="password">Mật khẩu</label>
        <div className="login-input-wrap">
          <LockKeyhole aria-hidden="true" className="login-input-icon" />
          <input id="password" name="password" type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required disabled={pending} />
          <button className="login-password-toggle" type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>
            {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div className="login-options">
        <label className="login-remember" title="Giữ đăng nhập trong 30 ngày; chỉ chọn trên thiết bị cá nhân"><input type="checkbox" name="remember" checked={remember} onChange={event => setRemember(event.target.checked)} /><span>Ghi nhớ đăng nhập</span></label>
        <button className="login-forgot" style={{ border: 0, background: "transparent", padding: 0 }} type="button" onClick={() => setRecoveryHelp(value => !value)} aria-expanded={recoveryHelp}>Quên mật khẩu?</button>
      </div>
      {recoveryHelp && <p role="status" className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">Liên hệ quản trị viên của công ty và cung cấp email công việc. Sau khi xác minh danh tính, quản trị viên có thể đặt lại mật khẩu tại Trung tâm quản trị → Tài khoản & phân quyền.</p>}

      <button className="login-submit" type="submit" disabled={pending}>
        {pending ? <><LoaderCircle className="login-spinner" aria-hidden="true" /> Đang xác thực...</> : <>Đăng nhập <ArrowRight aria-hidden="true" /></>}
      </button>

      <div className="login-demo-card">
        <Building2 aria-hidden="true" className="login-demo-icon" />
        <div className="login-demo-copy"><strong>Tài khoản demo</strong><span>admin / hr / manager / employee</span><small>@vinamilk.demo</small></div>
        <div className="login-demo-password"><span>Mật khẩu: <strong>Demo@123</strong></span><button type="button" onClick={copyDemoPassword} aria-label="Sao chép mật khẩu demo">{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}</button></div>
        {copied && <span className="login-copy-status" role="status">Đã sao chép</span>}
      </div>
    </form>
  );
}
