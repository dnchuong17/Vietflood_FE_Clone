import type { ReactNode } from "react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

type AuthFormCardProps = {
    title: string;
    description: string;
    note?: string;
    children: ReactNode;
};

export function AuthFormCard({ title, description, note, children }: AuthFormCardProps) {
    return (
        <div className="mx-auto grid w-[min(1120px,92vw)] place-items-center py-6">
            <Card className="mx-auto w-full max-w-xl shadow-[0_18px_60px_rgba(4,20,47,0.12)]">
                <CardHeader className="text-center">
                    <CardTitle className="[font-family:var(--font-heading)] text-[clamp(1.4rem,2.5vw,2rem)]">
                        {title}
                    </CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                {children}

                {note ? (
                    <p className="mt-1.5 text-center text-sm italic text-muted-foreground">
                        {note}
                    </p>
                ) : null}
                </CardContent>
            </Card>
        </div>
    );
}
