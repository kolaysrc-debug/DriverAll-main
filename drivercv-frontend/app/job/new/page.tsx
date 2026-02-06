// PATH: DriverAll-main/drivercv-frontend/app/jobs/new/page.tsx

import { redirect } from "next/navigation";

// Bu route eskiden kullanıldıysa kırılmasın diye sadece yeni adrese yönlendiriyoruz.
export default function JobsNewRedirectPage() {
  redirect("/employer/jobs/new");
}
