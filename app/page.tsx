import Link from "next/link";
import {
  ArrowRight,
  MessageSquare,
  Database,
  Zap,
  Code,
  Shield,
  BarChart3,
  CheckCircle2,
  Upload,
  Globe,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative pt-24 pb-32 lg:pt-36 lg:pb-40">
        {/* Background Blobs */}
        <div className="absolute top-0 left-1/2 -z-10 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px] dark:bg-primary/20" />
        <div className="absolute top-40 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-fuchsia-500/10 blur-[100px]" />

        <div className="mx-auto max-w-7xl px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-8 animate-fade-in backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span>Docs in. Chatbot out</span>
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto max-w-5xl text-4xl font-extrabold tracking-tight text-foreground sm:text-7xl mb-8 animate-slide-up">
            Train a chatbot on your files
            <br className="hidden sm:block" />
            <span className="gradient-text">
              then plug it into your website.
            </span>
          </h1>

          <p
            className="mx-auto max-w-2xl text-lg text-muted-foreground mb-12 leading-relaxed animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            Let's you build custom AI agents trained on your data and plugin
            them into any website in seconds. No coding required.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Link
              href="/chatbot/create"
              className="h-12 px-8 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 flex items-center gap-2"
            >
              Build your Chatbot <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Hero Visual / Mockup */}
          <div
            className="relative mx-auto max-w-5xl animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="relative rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-2 shadow-2xl shadow-primary/10">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-fuchsia-500/5 rounded-2xl" />

              {/* Fake UI for Dashboard Preview */}
              <div className="aspect-[16/9] w-full rounded-xl bg-muted/50 border border-border overflow-hidden relative group">
                {/* Abstract Data Visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center border border-border animate-float">
                        <Database className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <span className="h-0.5 w-12 bg-border relative overflow-hidden">
                          <span className="absolute inset-0 bg-primary w-1/2 animate-[shimmer_2s_infinite]"></span>
                        </span>
                      </div>
                      <div
                        className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-fuchsia-600 shadow-lg flex items-center justify-center text-white animate-float"
                        style={{ animationDelay: "1s" }}
                      >
                        <Zap className="h-8 w-8" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Processing Knowledge Base...
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating Chat Element */}
              <div className="absolute -bottom-12 -right-4 md:-right-12 hidden md:block animate-float">
                <div className="w-80 rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-black/5 dark:shadow-black/20">
                  <div className="flex items-center gap-3 border-b border-border pb-3 mb-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        Assistant
                      </div>
                      <div className="text-xs text-emerald-500 flex items-center gap-1">
                        ● Online
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="self-start rounded-2xl rounded-tl-none bg-muted px-4 py-2 text-sm text-muted-foreground w-3/4">
                      How can I integrate this?
                    </div>
                    <div className="self-end rounded-2xl rounded-tr-none bg-primary px-4 py-2 text-sm text-primary-foreground w-3/4 ml-auto shadow-md shadow-primary/20">
                      Just copy the embed code and paste it into your
                      `index.html`. It takes 30 seconds!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED BY */}
      {/* <section className="py-10 border-y border-border bg-secondary/30">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm font-semibold tracking-wider text-muted-foreground mb-8 uppercase">
            Trusted by forward-thinking teams
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500"> */}
      {/* Replace these divs with actual SVGs of logos */}
      {/* <div className="h-8 w-24 bg-foreground/20 rounded animate-pulse" />
            <div className="h-8 w-24 bg-foreground/20 rounded animate-pulse delay-75" />
            <div className="h-8 w-24 bg-foreground/20 rounded animate-pulse delay-150" />
            <div className="h-8 w-24 bg-foreground/20 rounded animate-pulse delay-200" />
            <div className="h-8 w-24 bg-foreground/20 rounded animate-pulse delay-300" />
          </div>
        </div>
      </section> */}

      {/* HOW IT WORKS (Gifo Style Flow) */}
      <section
        id="how-it-works"
        className="py-24 border-y border-border bg-secondary/30 relative"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Zap className="h-4 w-4" /> Process
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              How it works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              We simplify the complex process of RAG (Retrieval Augmented
              Generation) into three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent border-t border-dashed border-primary/30 z-0"></div>

            {[
              {
                step: "01",
                icon: <Upload className="h-6 w-6" />,
                title: "Connect Data",
                desc: "Upload PDFs, sitemaps, or text files. We automatically process and chunk your data.",
              },
              {
                step: "02",
                icon: <Code className="h-6 w-6" />,
                title: "Customize & Embed",
                desc: "Style your widget to match your brand. Copy one line of code to your site.",
              },
              {
                step: "03",
                icon: <BarChart3 className="h-6 w-6" />,
                title: "Analyze & Improve",
                desc: "View chat logs, identify knowledge gaps, and update your bot in real-time.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div className="w-24 h-24 rounded-3xl bg-card border border-border shadow-lg flex items-center justify-center mb-6 group-hover:border-primary/50 group-hover:shadow-primary/20 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-24 bg-secondary/20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-6">
              Everything you need to build <br />
              <span className="gradient-text">powerful AI agents</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Database className="h-6 w-6 text-violet-500" />,
                title: "Hybrid Search",
                desc: "Combines vector semantic search with keyword search for maximum accuracy.",
              },
              {
                icon: <Globe className="h-6 w-6 text-blue-500" />,
                title: "Multi-Source",
                desc: "Train on websites, Notion pages, Google Docs, and raw text simultaneously.",
              },
              {
                icon: <BarChart3 className="h-6 w-6 text-emerald-500" />,
                title: "Deep Analytics",
                desc: "Understand what your users are asking and improve your knowledge base.",
              },
              {
                icon: <Shield className="h-6 w-6 text-rose-500" />,
                title: "Secure & Private",
                desc: "Your data is encrypted at rest and in transit. We prioritize your privacy.",
              },
              {
                icon: <Zap className="h-6 w-6 text-amber-500" />,
                title: "Streaming API",
                desc: "Fast, token-by-token streaming responses just like ChatGPT.",
              },
              {
                icon: <MessageSquare className="h-6 w-6 text-pink-500" />,
                title: "Customizable UI",
                desc: "Match the chat widget to your brand colors and personality.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group p-8 rounded-3xl bg-card border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary group-hover:bg-primary/10 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-foreground px-6 py-20 text-center shadow-2xl sm:px-12">
            {/* CTA Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
              <div className="absolute top-0 -left-10 h-96 w-96 rounded-full bg-primary/40 blur-[100px]" />
              <div className="absolute bottom-0 -right-10 h-96 w-96 rounded-full bg-fuchsia-600/40 blur-[100px]" />
            </div>

            <div className="relative z-10">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-background sm:text-5xl mb-6">
                Ready to upgrade your website?
              </h2>
              <p className="mx-auto max-w-xl text-lg text-background/70 mb-10">
                Join thousands of developers building the future of
                conversational AI with Plugin_base.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/chatbot/create"
                  className="rounded-full border bg-black/40 border-black/40 px-8 py-4 text-lg font-bold text-white hover:bg-black/50 transition-colors"
                >
                  Get started now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* FOOTER */}
      <footer className="border-t border-border bg-card pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs text-white font-bold">
                P
              </div>
              <span className="font-bold text-foreground text-lg">
                Plugin_base
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Made with ♥️ and lot of ☕️ {""}
              <span>
                <Link
                  href="https://sheik-portfolio-taupe.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  By{" "}
                  <span className="hover:text-primary transition-colors font-medium">
                    Shiek
                  </span>
                  .
                </Link>
              </span>
            </p>
          </div>

          <div className="flex gap-8 text-sm font-medium text-muted-foreground">
            <Link
              href="https://github.com/zoro-zuro/plugIN_base.git"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
