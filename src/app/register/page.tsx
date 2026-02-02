"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, UserPlus, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setError(null);
        startTransition(async () => {
            const result = await registerUser(formData);
            if (result?.error) {
                setError(result.error);
            } else {
                router.push("/login?refresh=true");
            }
        });
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-bg-void animate-in fade-in duration-500">
            <Card className="w-full max-w-md p-8 border-primary/20 shadow-[0_0_50px_rgba(255,77,77,0.1)]">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                        <UserPlus className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Join the Guild
                    </h1>
                    <p className="text-text-secondary mt-2">Create your Questline Architect account.</p>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold ml-1">Email</label>
                        <Input
                            name="email"
                            type="email"
                            placeholder="hero@quest.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold ml-1">Password</label>
                        <Input
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold ml-1">Hero Name (Optional)</label>
                        <Input
                            name="displayName"
                            placeholder="Sir Codealot"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded bg-red-950/30 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <Button
                        className="w-full gap-2 mt-4"
                        size="lg"
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                        {isPending ? "Creating Account..." : "Register"}
                    </Button>
                </form>

                <div className="mt-6 text-center text-xs text-text-muted">
                    Already have an account? <Link href="/login" className="text-primary hover:underline">Login here</Link>
                </div>
            </Card>
        </div>
    );
}
