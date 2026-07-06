import { Card, Link } from "@heroui/react";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-16">
      <Card className="w-full">
        <Card.Header className="flex-col items-start gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            RackUp Frontend
          </h1>
          <p className="text-sm text-default-500">
            Open the dedicated health page to verify backend connectivity.
          </p>
        </Card.Header>
        <Card.Content>
          <Link href="/health">Open Health Page</Link>
        </Card.Content>
      </Card>
    </main>
  );
}
