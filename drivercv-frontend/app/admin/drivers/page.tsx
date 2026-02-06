// PATH: DriverAll-main/drivercv-frontend/app/admin/drivers/page.tsx
// ----------------------------------------------------------
// Redirect: /admin/drivers -> /admin/users
// (drivers ismi yüzünden karışıklık olmasın)
// ----------------------------------------------------------

import { redirect } from "next/navigation";

export default function AdminDriversRedirectPage() {
  redirect("/admin/users");
}
