import {
  signInWithGithubAction,
  signInWithGoogleAction,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function SocialAuthButtons() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <form action={signInWithGoogleAction}>
        <Button type="submit" variant="secondary" className="w-full">
          Войти через Google
        </Button>
      </form>
      <form action={signInWithGithubAction}>
        <Button type="submit" variant="secondary" className="w-full">
          Войти через GitHub
        </Button>
      </form>
    </div>
  );
}
