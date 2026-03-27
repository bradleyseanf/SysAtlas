import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import loginWaves from "../assets/login-waves.lottie";

function App() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f1114] text-atlas-mist">
      <div className="pointer-events-none absolute inset-0 grid-sheen opacity-20" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.04),transparent_22%),linear-gradient(180deg,rgba(15,17,20,0.92),rgba(11,12,15,0.98))]" />
        <DotLottieReact
          src={loginWaves}
          autoplay
          loop
          speed={0.75}
          useFrameInterpolation={false}
          renderConfig={{ autoResize: true, devicePixelRatio: 1.25 }}
          className="absolute inset-[-18%] h-[136%] w-[136%] opacity-[0.18] mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,17,20,0.12)_44%,rgba(11,12,15,0.54)_100%)]" />
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12 lg:px-10">
        <div className="w-full max-w-[540px]">
          <section className="rounded-[32px] border border-white/20 bg-[rgba(29,16,21,0.78)] p-8 shadow-[0_28px_80px_rgba(18,6,10,0.52)] backdrop-blur-[18px] lg:p-10">
            <div>
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.28em] text-[#d55472]">
                Portal Access
              </p>
              <div className="mt-5 space-y-4">
                <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#f8edf0] md:text-[3.35rem]">
                  SysAtlas
                </h1>
                <p className="max-w-xl text-base leading-7 text-[#f3dce1]/78 md:text-lg">
                  Systems Atlas (A.T.L.A.S) - Systems Automation Tool Linking All Systems
                </p>
              </div>
            </div>

            <form
              className="mt-10 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <label className="block">
                <span className="mb-2 block text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#cf6a7f]">
                  Email
                </span>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-2xl border border-[#6d3d47] bg-[rgba(90,39,49,0.34)] px-4 py-3.5 text-[#f8edf0] outline-none transition placeholder:text-[#cfaeb6]/40 focus:border-[#d55472] focus:bg-[rgba(98,40,51,0.46)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#cf6a7f]">
                  Password
                </span>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-[#6d3d47] bg-[rgba(90,39,49,0.34)] px-4 py-3.5 text-[#f8edf0] outline-none transition placeholder:text-[#cfaeb6]/40 focus:border-[#d55472] focus:bg-[rgba(98,40,51,0.46)]"
                />
              </label>

              <div className="flex items-center justify-between text-sm text-[#e8d3d8]/72">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-[#6d3d47] bg-[rgba(90,39,49,0.34)] accent-[#c73e59]" />
                  Keep me signed in
                </label>
                <button type="button" className="text-[#d55472] transition hover:text-[#f0c8d0]">
                  Need access?
                </button>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl border border-[#df6f87]/35 bg-[#c73e59] px-4 py-3.5 text-base font-semibold tracking-[0.08em] text-[#fff7f8] transition hover:bg-[#d55472] hover:shadow-[0_18px_40px_rgba(199,62,89,0.32)]"
              >
                Sign in
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
