import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { Separator } from "@/components/ui/separator";

const NotFoundPage = () => {
  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <PageHeading accentSymbol="🧭" badge="404" title="Page not found" />
        </CardHeader>
        <CardContent>
          <Separator tone="soft" />
          <p className="max-w-xl text-sm text-[var(--text-secondary)]">
            The route you opened is not part of the current foundation scope. Use the shell navigation to
            return to a supported area.
          </p>
          <Link
            className="mt-3 inline-flex rounded-xl bg-[var(--accent-solid)] px-3 py-2 text-sm font-medium text-[var(--text-strong)]"
            data-focus-ring="visible"
            to="/"
          >
            Back to dashboard
          </Link>
        </CardContent>
      </Card>
    </section>
  );
};

export default NotFoundPage;
