import { logoutAction } from "@/lib/actions/auth";
import { buttonClasses, type ButtonVariant } from "@/lib/ui";

export function LogoutButton({ variant = "secondary" }: { variant?: ButtonVariant }) {
  return (
    <form action={logoutAction}>
      <button type="submit" className={buttonClasses(variant, "md")}>
        Log out
      </button>
    </form>
  );
}
