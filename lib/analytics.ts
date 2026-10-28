import { readEnv } from "./supabase";

export async function clarityId(): Promise<string | undefined> {
  const id = await readEnv("NEXT_PUBLIC_CLARITY_ID");
  return id && /^[a-z0-9]+$/i.test(id) ? id : undefined;
}

export function clarityScript(id: string): string {
  return `<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${id}");</script>`;
}
