import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const NotFoundPage = () => {
  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <p className="text-[var(--type-caption)] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">404</p>
          <CardTitle className="text-[var(--type-heading)]">Page not found</CardTitle>
        </CardHeader>
        <CardContent>
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
