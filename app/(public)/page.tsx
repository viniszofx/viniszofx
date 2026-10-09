import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function Page() {
  return (
    <main className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center bg-muted/30 px-4 py-12 sm:px-6">
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader className="flex flex-col items-center justify-center gap-4 text-center">
          <Avatar size="lg" className="size-16">
            <AvatarImage
              src="https://github.com/viniszofx.png"
              alt="Vinicius Souza"
            />
            <AvatarFallback>VS</AvatarFallback>
          </Avatar>
          <CardTitle>Atualizações estão em andamento</CardTitle>
          <CardDescription>
            Estamos trabalhando para trazer novidades em breve.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
          <Button
            nativeButton={false}
            render={<Link href="https://google.com" />}
          >
            Voltar a navegar
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
