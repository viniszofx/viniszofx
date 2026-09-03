import { Avatar, AvatarImage } from "@/components/ui/avatar";
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
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="mx-auto container">
        <CardHeader className="flex flex-col items-center justify-center gap-4">
          <Avatar>
            <AvatarImage src={"https://github.com/viniszofx.png"} alt="User" />
          </Avatar>
          <CardTitle>Atualizações estão em andamento</CardTitle>
          <CardDescription>
            Estamos trabalhando para trazer novidades em breve.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4">
          <Button variant="outline">
            <Link href="https://google.com">Voltar a navegar</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
