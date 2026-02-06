import { redirect } from "next/navigation";

// /jobs/new eski linkleri bozulmasın diye doğru işveren sayfasına yönlendiriyoruz.
export default function JobsNewRedirectPage() {
  redirect("/employer/jobs/new");
}
