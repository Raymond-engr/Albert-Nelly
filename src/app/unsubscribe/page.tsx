import Link from "next/link";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface UnsubscribePageProps {
  searchParams: Promise<{ t?: string }>;
}

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const { t: token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5] p-6 text-[#06281E] font-sans">
        <div className="max-w-md w-full rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
          <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">Invalid or Missing Link</h1>
          <p className="text-sm text-[#42594E]">
            This unsubscribe link appears to be invalid or expired. If you need assistance, please contact us directly.
          </p>
        </div>
      </div>
    );
  }

  const leadId = verifyUnsubscribeToken(token);

  if (!leadId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5] p-6 text-[#06281E] font-sans">
        <div className="max-w-md w-full rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
          <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">Invalid Security Token</h1>
          <p className="text-sm text-[#42594E]">
            The security signature on this link could not be verified. Please check the link and try again.
          </p>
        </div>
      </div>
    );
  }

  const admin = getAdminClient();
  if (admin) {
    await admin
      .from("leads")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("id", leadId);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5] p-6 text-[#06281E] font-sans">
      <div className="max-w-md w-full rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
        <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-[#E9F8F0] text-[#12B76A]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-xl font-bold mb-2">You Have Been Unsubscribed</h1>
        <p className="text-sm text-[#42594E] leading-relaxed mb-6">
          You will no longer receive marketing updates, announcement campaigns, or birthday perks from Albert Nelly.
        </p>
        <Link
          href="/"
          className="inline-block rounded-full bg-[#06281E] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#12B76A]"
        >
          Return to Showroom
        </Link>
      </div>
    </div>
  );
}
