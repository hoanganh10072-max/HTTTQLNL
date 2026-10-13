import Image from "next/image";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  ClipboardList,
  Globe2,
  Users,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

const features = [
  { label: "Quản lý nhân sự", icon: Users },
  { label: "Chấm công & nghỉ phép", icon: CalendarDays },
  { label: "Tuyển dụng", icon: ClipboardList },
  { label: "Báo cáo thông minh", icon: ChartNoAxesCombined },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "login-brand login-brand-card" : "login-brand"}>
      <p className="login-brand-name">VINAMILK</p>
      <p className="login-brand-subtitle">Human Resource Management</p>
    </div>
  );
}

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <main className="login-shell">
      <section className="login-hero" style={{ position: "relative" }} aria-label="Giới thiệu hệ thống quản trị nhân sự">
        <Image
          src="/assets/login/hr-office-hero.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 1280px) 57vw, (min-width: 1024px) 46vw, 0px"
          className="login-hero-image"
        />
        <div className="login-hero-overlay" aria-hidden="true" />
        <div className="login-hero-content">
          <Brand />

          <div className="login-hero-main">
            <div className="login-eyebrow">
              <span aria-hidden="true" />
              Con người tạo nên giá trị
            </div>
            <h1>
              Quản trị con người.
              <strong>Vận hành bền vững.</strong>
            </h1>
            <p className="login-hero-description">
              Nền tảng quản lý hồ sơ, chấm công, nghỉ phép, tuyển dụng và tiền lương
              dành cho tổ chức đa đơn vị.
            </p>

            <div className="login-feature-grid">
              {features.map(({ label, icon: Icon }) => (
                <div className="login-feature" key={label}>
                  <span className="login-feature-icon"><Icon aria-hidden="true" /></span>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <p className="login-promise">Vì một ngày mai tốt đẹp hơn</p>
          </div>

          <footer className="login-hero-footer">
            © 2026 Vinamilk. Dữ liệu trong bản demo hoàn toàn là dữ liệu mô phỏng.
          </footer>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel-shape login-panel-shape-one" aria-hidden="true" />
        <div className="login-panel-shape login-panel-shape-two" aria-hidden="true" />

        <div className="login-language" aria-label="Ngôn ngữ hiện tại: Tiếng Việt">
          <Globe2 aria-hidden="true" />
          <span>Tiếng Việt</span>
          <ChevronDown aria-hidden="true" />
        </div>

        <div className="login-panel-center">
          <div className="login-card">
            <Brand compact />
            <div className="login-card-heading">
              <h2>Chào mừng trở lại</h2>
              <p>Đăng nhập để tiếp tục làm việc.</p>
            </div>
            <LoginForm />
          </div>
          <p className="login-panel-footer">Con người <span>•</span> Dinh dưỡng <span>•</span> Cuộc sống tốt đẹp hơn</p>
        </div>
      </section>
    </main>
  );
}
