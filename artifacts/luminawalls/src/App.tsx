import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AiLab from "@/pages/ai-lab";
import Favorites from "@/pages/favorites";
import WallpaperDetail from "@/pages/wallpaper-detail";
import Admin from "@/pages/admin";
import { MobileNav } from "@/components/MobileNav";
import { Zap } from "lucide-react";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function AuthPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#080808]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center mb-6">
        <div className="relative mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/30">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div className="absolute inset-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 blur-xl opacity-40" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Chao<span className="text-violet-500">Pixels</span>
        </h1>
        <p className="text-sm mt-1 text-white/40">Your wallpaper universe</p>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>

      <p className="relative z-10 mt-6 text-xs text-white/25">
        Made with ♥ by chaotechh
      </p>
    </div>
  );
}

const clerkVars = {
  colorBackground: "#1a1a2e",
  colorText: "#f1f5f9",
  colorTextSecondary: "#94a3b8",
  colorPrimary: "#7c3aed",
  colorInputBackground: "#0f0f1a",
  colorInputText: "#f1f5f9",
  colorNeutral: "#f1f5f9",
  borderRadius: "0.75rem",
};

const clerkElements = {
  card: "!bg-[#1a1a2e] !border !border-violet-900/40 !shadow-2xl !shadow-violet-500/10",
  headerTitle: "!text-slate-50 !font-bold",
  headerSubtitle: "!text-slate-400",
  socialButtonsBlockButton: "!bg-white/6 !border !border-white/12 !text-slate-200 hover:!bg-white/12",
  socialButtonsBlockButtonText: "!text-slate-200",
  formFieldLabel: "!text-slate-300",
  formFieldInput: "!bg-[#0f0f1a] !border-violet-900/40 !text-slate-100 focus:!border-violet-500",
  footerActionText: "!text-slate-400",
  footerActionLink: "!text-violet-400 hover:!text-violet-300",
  dividerText: "!text-slate-500",
  dividerLine: "!bg-white/10",
  identityPreviewText: "!text-slate-300",
  identityPreviewEditButton: "!text-violet-400",
};

function SignInPage() {
  return (
    <AuthPageLayout>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={{ variables: clerkVars, elements: clerkElements }}
      />
    </AuthPageLayout>
  );
}

function SignUpPage() {
  return (
    <AuthPageLayout>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={{ variables: clerkVars, elements: clerkElements }}
      />
    </AuthPageLayout>
  );
}

function ClerkQueryCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const uid = user?.id ?? null;
      if (prevRef.current !== undefined && prevRef.current !== uid) {
        qc.clear();
      }
      prevRef.current = uid;
    });
    return unsub;
  }, [addListener, qc]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/ai-lab" component={AiLab} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/wallpaper/:id" component={WallpaperDetail} />
      <Route path="/admin" component={Admin} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
      afterSignInUrl={`${basePath}/`}
      afterSignUpUrl={`${basePath}/`}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryCacheInvalidator />
        <TooltipProvider>
          <div className="dark min-h-screen bg-background text-foreground pb-16 md:pb-0">
            <Router />
            <MobileNav />
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
