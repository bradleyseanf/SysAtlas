// Logo sources:
// - Microsoft service marks adapted from Dashboard Icons (Apache-2.0)
//   https://github.com/homarr-labs/dashboard-icons
// - Zoom, Zoho, and Verizon marks adapted from Simple Icons (CC0-1.0)
//   https://simpleicons.org

type LogoDefinition = {
  src: string;
};

type LogoSize = "sm" | "md" | "lg";

type IntegrationLogoProps = {
  providerId: string;
  providerName: string;
  size?: LogoSize;
};

const sizeClasses: Record<LogoSize, string> = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
};

const boxSizes: Record<LogoSize, number> = {
  sm: 36,
  md: 40,
  lg: 56,
};

const imageSizes: Record<LogoSize, number> = {
  sm: 20,
  md: 24,
  lg: 32,
};

function svgDataUrl(markup: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup)}`;
}

const logoByBrand: Record<string, LogoDefinition> = {
  microsoftWindows: {
    src: svgDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 512 512"><path d="M0 0h242.7v242.6H0zm269.3 0H512v242.6H269.3zM0 269.3h242.7V512H0zm269.3 0H512V512H269.3" style="fill:#0078d4"/></svg>`,
    ),
  },
  microsoftIntune: {
    src: svgDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0.69 5.4 400 390.62">
<g clip-path="url(#clip0_10641_164)">
<path d="M0.685165 65.8523C0.685165 14.7648 67.4855 -13.2029 111.616 19.4083L207.551 90.2535L288.514 44.373C331.305 21.0394 399.874 37.7748 400.685 101.559L400.685 336.622C400.685 387.71 335.845 414.343 291.715 381.732L194.031 309.34L112.973 355.23C69.7783 378.784 0.752625 360.714 0.752625 298.637C0.752654 224.124 0.685165 252.734 0.685165 65.8523Z" fill="url(#paint0_linear_10641_164)"/>
<path d="M0.685165 65.8523C0.685165 14.7648 67.4855 -13.2029 111.616 19.4083L207.551 90.2535L288.514 44.373C331.305 21.0394 399.874 37.7748 400.685 101.559L400.685 336.622C400.685 387.71 335.845 414.343 291.715 381.732L194.031 309.34L112.973 355.23C69.7783 378.784 0.752625 360.714 0.752625 298.637C0.752654 224.124 0.685165 252.734 0.685165 65.8523Z" fill="url(#paint1_radial_10641_164)"/>
<path d="M0.685165 65.8523C0.685165 14.7648 67.4855 -13.2029 111.616 19.4083L207.551 90.2535L288.514 44.373C331.305 21.0394 399.874 37.7748 400.685 101.559L400.685 336.622C400.685 387.71 335.845 414.343 291.715 381.732L194.031 309.34L112.973 355.23C69.7783 378.784 0.752625 360.714 0.752625 298.637C0.752654 224.124 0.685165 252.734 0.685165 65.8523Z" fill="url(#paint2_radial_10641_164)"/>
<path d="M111.616 19.4083C67.4855 -13.2029 0.685165 14.7648 0.685165 65.8523V295.742C0.685165 290.153 3.5327 279.026 3.5327 279.026C16.6954 236.001 72.6487 219.869 111.36 248.223L291.715 381.732C335.845 414.343 400.685 387.71 400.685 336.622V101.559C400.685 145.201 343.643 189.011 289.755 151.051L111.616 19.4083Z" fill="url(#paint3_radial_10641_164)"/>
<path d="M111.616 19.4083C67.4855 -13.2029 0.685165 14.7648 0.685165 65.8523V295.742C0.685165 290.153 3.5327 279.026 3.5327 279.026C16.6954 236.001 72.6487 219.869 111.36 248.223L291.715 381.732C335.845 414.343 400.685 387.71 400.685 336.622V101.559C400.685 145.201 343.643 189.011 289.755 151.051L111.616 19.4083Z" fill="url(#paint4_radial_10641_164)" fill-opacity="0.25"/>
<path d="M111.616 19.4083C67.4855 -13.2029 0.685165 14.7648 0.685165 65.8523V295.742C0.685165 290.153 3.5327 279.026 3.5327 279.026C16.6954 236.001 72.6487 219.869 111.36 248.223L291.715 381.732C335.845 414.343 400.685 387.71 400.685 336.622V101.559C400.685 145.201 343.643 189.011 289.755 151.051L111.616 19.4083Z" fill="url(#paint5_radial_10641_164)" fill-opacity="0.55"/>
<path d="M111.616 149.691C67.4855 117.08 0.685165 145.048 0.685165 196.135L0.685179 65.8523C0.685183 14.7648 67.4855 -13.2029 111.616 19.4083C170.996 63.2888 230.374 107.171 289.755 151.051C343.643 189.011 400.685 145.201 400.685 101.559V234.89C400.685 285.978 333.885 313.946 289.755 281.334C230.374 237.454 170.996 193.572 111.616 149.691Z" fill="url(#paint6_linear_10641_164)"/>
<path d="M111.616 149.691C67.4855 117.08 0.685165 145.048 0.685165 196.135L0.685179 65.8523C0.685183 14.7648 67.4855 -13.2029 111.616 19.4083C170.996 63.2888 230.374 107.171 289.755 151.051C343.643 189.011 400.685 145.201 400.685 101.559V234.89C400.685 285.978 333.885 313.946 289.755 281.334C230.374 237.454 170.996 193.572 111.616 149.691Z" fill="url(#paint7_radial_10641_164)" fill-opacity="0.35"/>
</g>
<defs>
<linearGradient id="paint0_linear_10641_164" x1="171.501" y1="396.026" x2="314.256" y2="90.5646" gradientUnits="userSpaceOnUse">
<stop offset="0.02" stop-color="#1169DA"/>
<stop offset="0.434784" stop-color="#0151BD"/>
<stop offset="0.614436" stop-color="#014DB7"/>
<stop offset="1" stop-color="#126AD9"/>
</linearGradient>
<radialGradient id="paint1_radial_10641_164" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(358.656 -48.704) rotate(110.224) scale(292.248 218.917)">
<stop offset="0.422966" stop-color="#004AFF" stop-opacity="0.1"/>
<stop offset="0.728672" stop-color="#014DB9"/>
<stop offset="0.836135" stop-color="#014DB9" stop-opacity="0.9"/>
<stop offset="0.955" stop-color="#014DB9" stop-opacity="0"/>
</radialGradient>
<radialGradient id="paint2_radial_10641_164" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(54.0821 384.087) rotate(-73.6432) scale(232.668 283.419)">
<stop offset="0.0908532" stop-color="#004AFF" stop-opacity="0.1"/>
<stop offset="0.56036" stop-color="#014DB9"/>
<stop offset="0.749466" stop-color="#014DB9" stop-opacity="0.99"/>
<stop offset="1" stop-color="#014DB9" stop-opacity="0"/>
</radialGradient>
<radialGradient id="paint3_radial_10641_164" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(439.444 5.40101) rotate(134.068) scale(563.957 434.374)">
<stop offset="0.249322" stop-color="#23C0FE"/>
<stop offset="0.717207" stop-color="#23C0FE"/>
<stop offset="0.995168" stop-color="#1C91FF"/>
</radialGradient>
<radialGradient id="paint4_radial_10641_164" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(119.961 37.1103) rotate(45.9092) scale(403.457 95.9789)">
<stop offset="0.165" stop-color="#096DD6" stop-opacity="0"/>
<stop offset="0.484233" stop-color="#096DD6"/>
<stop offset="0.900505" stop-color="#0876DE" stop-opacity="0.813868"/>
<stop offset="1" stop-color="#029AFF" stop-opacity="0"/>
</radialGradient>
<radialGradient id="paint5_radial_10641_164" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(385.776 245.022) rotate(91.6099) scale(64.799 58.3555)">
<stop stop-color="#0068B3"/>
<stop offset="0.93" stop-color="#006CB8" stop-opacity="0"/>
</radialGradient>
<linearGradient id="paint6_linear_10641_164" x1="114.72" y1="97.5227" x2="182.067" y2="383.699" gradientUnits="userSpaceOnUse">
<stop stop-color="#92EEFE"/>
<stop offset="0.564559" stop-color="#35DDFF"/>
<stop offset="1" stop-color="#08B1F9"/>
</linearGradient>
<radialGradient id="paint7_radial_10641_164" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(67.7807 5.4011) rotate(69.461) scale(99.6637 80.4988)">
<stop stop-color="#CCF9FF" stop-opacity="0.93"/>
<stop offset="1" stop-color="#35DDFF"/>
</radialGradient>
<clipPath id="clip0_10641_164">
<rect width="400" height="400" fill="white" transform="translate(0.685181 0.713501)"/>
</clipPath>
</defs>
</svg>`,
    ),
  },
  microsoft365AdminCenter: {
    src: svgDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="5 5 37.78 38"><circle cx="28" cy="23.996" r="7.996" fill="#fff"/><linearGradient id="a" x1="29" x2="49.8" y1="23.513" y2="23.513" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#b8b8b8"/><stop offset=".266" stop-color="#bbb"/><stop offset=".499" stop-color="#c6c6c6"/><stop offset=".72" stop-color="#d8d8d8"/><stop offset=".932" stop-color="#f0f0f1"/><stop offset="1" stop-color="#fafafb"/></linearGradient><path fill="url(#a)" d="m42.242 25.832-3.25-1.678c.001-.053.008-.105.008-.158 0-.906-.122-1.782-.328-2.624l2.792-2.369a1 1 0 0 0 .228-1.247l-1.144-2.064a1 1 0 0 0-1.178-.468l-3.484 1.111a11 11 0 0 0-2.194-1.74l.299-3.65a1 1 0 0 0-.721-1.043L31 9.252a1 1 0 0 0-1.164.503l-1.678 3.25c-.053-.001-.105-.008-.158-.008-6.075 0-11 4.925-11 11s4.925 11 11 11c.906 0 1.782-.122 2.624-.328l2.369 2.792a1 1 0 0 0 1.247.228l2.064-1.144a1 1 0 0 0 .468-1.178l-1.111-3.484c.67-.651 1.252-1.39 1.74-2.194l3.65.299a1 1 0 0 0 1.043-.721l.651-2.269c.131-.46-.08-.948-.503-1.166M28 30.996a7 7 0 1 1 0-14 7 7 0 0 1 0 14m3-7a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/><path d="M26.001 17.289A7 7 0 0 1 28 16.995v-4c-.684 0-1.35.071-2 .19zM28 20.996c-.771 0-1.467.299-1.999.778v4.445a2.98 2.98 0 0 0 1.999.777zm-1.998 9.707v4.103c.649.119 1.315.19 1.998.19v-4a7 7 0 0 1-1.998-.293" opacity=".05"/><path d="M27.5 21.046a3 3 0 0 0-1 .366v5.168c.305.177.639.305 1 .366zm-1-3.885q.489-.105 1-.14v-4q-.507.022-1 .089zm1 13.81a7 7 0 0 1-1-.14v4.051q.493.067 1 .089z" opacity=".07"/><linearGradient id="b" x1="26.869" x2="5.161" y1="23.992" y2="24.194" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#6b6b6b"/><stop offset=".96" stop-color="#464646"/><stop offset="1" stop-color="#444"/></linearGradient><path fill="url(#b)" d="m25.813 42.982-20-3.827A1 1 0 0 1 5 38.172V9.828a1 1 0 0 1 .813-.982l20-3.827A1 1 0 0 1 27 6v36a1 1 0 0 1-1.187.982"/><path fill="#fff" d="m21.278 30.874-2.91-.117-.864-3.07-3.897-.047-.695 2.898-2.482-.1 3.545-13.061 2.92-.251zm-4.394-5.542-1.264-4.496a7 7 0 0 1-.202-1.193l-.061.004a6 6 0 0 1-.172 1.175l-1.102 4.538z"/></svg>`,
    ),
  },
  microsoftAzure: {
    src: svgDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 6.54 87.99 82.91"><defs><linearGradient id="a" x1="-1032.172" x2="-1059.213" y1="145.312" y2="65.426" gradientTransform="matrix(1 0 0 -1 1075 158)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#114a8b"/><stop offset="1" stop-color="#0669bc"/></linearGradient><linearGradient id="b" x1="-1023.725" x2="-1029.98" y1="108.083" y2="105.968" gradientTransform="matrix(1 0 0 -1 1075 158)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-opacity=".3"/><stop offset=".071" stop-opacity=".2"/><stop offset=".321" stop-opacity=".1"/><stop offset=".623" stop-opacity=".05"/><stop offset="1" stop-opacity="0"/></linearGradient><linearGradient id="c" x1="-1027.165" x2="-997.482" y1="147.642" y2="68.561" gradientTransform="matrix(1 0 0 -1 1075 158)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3ccbf4"/><stop offset="1" stop-color="#2892df"/></linearGradient></defs><path fill="url(#a)" d="M33.338 6.544h26.038l-27.03 80.087a4.15 4.15 0 0 1-3.933 2.824H8.149a4.145 4.145 0 0 1-3.928-5.47L29.404 9.368a4.15 4.15 0 0 1 3.934-2.825z"/><path fill="#0078d4" d="M71.175 60.261h-41.29a1.911 1.911 0 0 0-1.305 3.309l26.532 24.764a4.17 4.17 0 0 0 2.846 1.121h23.38z"/><path fill="url(#b)" d="M33.338 6.544a4.12 4.12 0 0 0-3.943 2.879L4.252 83.917a4.14 4.14 0 0 0 3.908 5.538h20.787a4.44 4.44 0 0 0 3.41-2.9l5.014-14.777 17.91 16.705a4.24 4.24 0 0 0 2.666.972H81.24L71.024 60.261l-29.781.007L59.47 6.544z"/><path fill="url(#c)" d="M66.595 9.364a4.145 4.145 0 0 0-3.928-2.82H33.648a4.15 4.15 0 0 1 3.928 2.82l25.184 74.62a4.146 4.146 0 0 1-3.928 5.472h29.02a4.146 4.146 0 0 0 3.927-5.472z"/></svg>`,
    ),
  },
  microsoftExchange: {
    src: svgDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 8 55 48"><path fill="#28a8ea" d="M55.51 8H43.303a3.5 3.5 0 0 0-2.468 1.022L12.022 37.835A3.5 3.5 0 0 0 11 40.303V52.51A3.49 3.49 0 0 0 14.49 56h12.207a3.5 3.5 0 0 0 2.468-1.022l28.813-28.813A3.5 3.5 0 0 0 59 23.697V11.49A3.49 3.49 0 0 0 55.51 8"/><path fill="#0078d4" d="M55.51 56H43.303a3.5 3.5 0 0 1-2.468-1.022L35 49.143V38.24A6.24 6.24 0 0 1 41.24 32h10.903l5.835 5.835A3.5 3.5 0 0 1 59 40.303V52.51A3.49 3.49 0 0 1 55.51 56"/><path fill="#50d9ff" d="M14.49 8h12.207a3.5 3.5 0 0 1 2.468 1.022L35 14.857V25.76A6.24 6.24 0 0 1 28.76 32H17.857l-5.835-5.835A3.5 3.5 0 0 1 11 23.697V11.49A3.49 3.49 0 0 1 14.49 8"/><path d="M33 20.33v26.34a1.7 1.7 0 0 1-.04.4A2.314 2.314 0 0 1 30.67 49H11V18h19.67A2.326 2.326 0 0 1 33 20.33" opacity=".2"/><path d="M34 20.33v24.34A3.36 3.36 0 0 1 30.67 48H11V17h19.67A3.34 3.34 0 0 1 34 20.33" opacity=".1"/><path d="M33 20.33v24.34A2.326 2.326 0 0 1 30.67 47H11V18h19.67A2.326 2.326 0 0 1 33 20.33" opacity=".2"/><path d="M32 20.33v24.34A2.326 2.326 0 0 1 29.67 47H11V18h18.67A2.326 2.326 0 0 1 32 20.33" opacity=".1"/><rect width="28" height="28" x="4" y="18" fill="#0078d4" rx="2.333"/><path fill="#fff" d="M22.585 26.881h-6.547v3.829h6.145v2.454h-6.145v3.976h6.896v2.443h-9.868V24.417h9.52Z"/></svg>`,
    ),
  },
  microsoftSharePoint: {
    src: svgDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="22" cy="22" r="14" fill="#0f766e"/><circle cx="43" cy="17" r="11" fill="#14b8a6"/><circle cx="45" cy="44" r="13" fill="#2dd4bf"/><rect x="19" y="18" width="25" height="30" rx="8" fill="#0f9f8d"/><path fill="#fff" d="M31.8 40.5c-6.2 0-10-3.4-10.5-8.8h6.2c.3 2.2 1.8 3.6 4.4 3.6 2.1 0 3.4-.8 3.4-2.2 0-1.4-1-1.9-4.8-2.8-5.6-1.3-8.7-3-8.7-8 0-4.9 4-8.1 9.9-8.1 6 0 9.8 3.2 10.2 8.5h-6.1c-.3-2-1.6-3.2-4-3.2-1.9 0-3 .8-3 2.1 0 1.3 1.1 1.8 4.6 2.6 5.9 1.4 9 3.2 9 8.1 0 5.1-4.1 8.2-10.6 8.2Z"/></svg>`,
    ),
  },
  microsoftTeams: {
    src: svgDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="47" cy="19" r="9" fill="#818cf8"/><circle cx="52" cy="38" r="8" fill="#6366f1"/><rect x="13" y="14" width="32" height="36" rx="8" fill="#4f46e5"/><rect x="22" y="21" width="25" height="22" rx="6" fill="#4338ca"/><path fill="#fff" d="M18.5 24.5h20v5.4h-7v15.1h-6v-15h-7Z"/></svg>`,
    ),
  },
  verizon: {
    src: svgDataUrl(
      `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#CD040B" d="M18.302 0H22v.003L10.674 24H7.662L2 12h3.727l3.449 7.337z"/></svg>`,
    ),
  },
  zoom: {
    src: svgDataUrl(
      `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#0B5CFF" d="M5.033 14.649H.743a.74.74 0 0 1-.686-.458.74.74 0 0 1 .16-.808L3.19 10.41H1.06A1.06 1.06 0 0 1 0 9.35h3.957c.301 0 .57.18.686.458a.74.74 0 0 1-.161.808L1.51 13.59h2.464c.585 0 1.06.475 1.06 1.06zM24 11.338c0-1.14-.927-2.066-2.066-2.066-.61 0-1.158.265-1.537.686a2.061 2.061 0 0 0-1.536-.686c-1.14 0-2.066.926-2.066 2.066v3.311a1.06 1.06 0 0 0 1.06-1.06v-2.251a1.004 1.004 0 0 1 2.013 0v2.251c0 .586.474 1.06 1.06 1.06v-3.311a1.004 1.004 0 0 1 2.012 0v2.251c0 .586.475 1.06 1.06 1.06zM16.265 12a2.728 2.728 0 1 1-5.457 0 2.728 2.728 0 0 1 5.457 0zm-1.06 0a1.669 1.669 0 1 0-3.338 0 1.669 1.669 0 0 0 3.338 0zm-4.82 0a2.728 2.728 0 1 1-5.458 0 2.728 2.728 0 0 1 5.457 0zm-1.06 0a1.669 1.669 0 1 0-3.338 0 1.669 1.669 0 0 0 3.338 0z"/></svg>`,
    ),
  },
  zoho: {
    src: svgDataUrl(
      `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#E42527" d="M8.66 6.897a1.299 1.299 0 0 0-1.205.765l-.642 1.44-.062-.385A1.291 1.291 0 0 0 5.27 7.648l-4.185.678A1.291 1.291 0 0 0 .016 9.807l.678 4.18a1.293 1.293 0 0 0 1.27 1.087c.074 0 .143-.01.216-.017l4.18-.678c.436-.07.784-.351.96-.723l2.933 1.307a1.304 1.304 0 0 0 .988.026c.321-.12.575-.365.716-.678l.28-.629.038.276a1.297 1.297 0 0 0 1.455 1.103l3.712-.501a1.29 1.29 0 0 0 1.03.514h4.236c.713 0 1.29-.58 1.291-1.291V9.545c0-.712-.58-1.291-1.291-1.291h-4.236c-.079 0-.155.008-.23.022a1.309 1.309 0 0 0-.275-.288c-.275-.21-.614-.3-.958-.253l-4.197.571c-.155.021-.3.07-.432.14L9.159 7.01a1.27 1.27 0 0 0-.499-.113zm-.025.705c.077 0 .159.013.24.052l2.971 1.324c-.128.238-.18.508-.142.782l.357 2.596h.002l-.745 1.672a.59.59 0 0 1-.777.296l-3.107-1.385-.004-.041-.41-2.526L8.1 7.95a.589.589 0 0 1 .536-.348zm-3.159.733c.125 0 .245.039.343.112.13.09.21.227.237.382l.234 1.446-.56 1.259a1.27 1.27 0 0 0-.026.987c.12.322.364.575.678.717l.295.131a.585.585 0 0 1-.428.314l-4.185.678a.59.59 0 0 1-.674-.485l-.678-4.18a.588.588 0 0 1 .485-.674l4.185-.678c.03-.004.064-.01.094-.01zm11.705.09a.59.59 0 0 1 .415.173 1.287 1.287 0 0 0-.416.947v4.237c0 .033.003.065.005.097l-3.55.482a.586.586 0 0 1-.66-.502l-.191-1.403.899-2.017a1.29 1.29 0 0 0-.333-1.5l3.754-.51c.026-.004.051-.004.077-.004zm1.3.532h4.227c.326 0 .588.266.588.588v4.237a.589.589 0 0 1-.588.588h-4.237a.564.564 0 0 1-.12-.013c.47-.246.758-.765.684-1.318zm-5.988.309.254.113c.296.133.43.48.296.777l-.432.97-.207-1.465a.58.58 0 0 1 .09-.395zm5.39.538.453 3.325a.583.583 0 0 1-.453.65zM6.496 11.545l.17 1.052a.588.588 0 0 1-.293-.776zm3.985 4.344a.588.588 0 0 0-.612.603c0 .358.244.61.601.61a.582.582 0 0 0 .607-.608c0-.35-.242-.605-.596-.605zm5.545 0a.588.588 0 0 0-.612.603c0 .358.245.61.602.61a.582.582 0 0 0 .606-.608c0-.35-.24-.605-.596-.605zm-8.537.018a.047.047 0 0 0-.048.047v.085c0 .026.021.047.048.047h.52l-.623.9a.052.052 0 0 0-.009.027v.027c0 .026.021.047.048.047h.815a.047.047 0 0 0 .047-.047v-.085a.047.047 0 0 0-.047-.047h-.55l.606-.9a.05.05 0 0 0 .008-.026v-.028a.047.047 0 0 0-.047-.047zm5.303 0a.047.047 0 0 0-.047.047v1.086c0 .026.02.047.047.047h.135a.047.047 0 0 0 .047-.047v-.454h.545v.454c0 .026.02.047.047.047h.134a.047.047 0 0 0 .047-.047v-1.086a.047.047 0 0 0-.047-.047h-.134a.047.047 0 0 0-.047.047v.453h-.545v-.453a.047.047 0 0 0-.047-.047zm-2.324.164c.25 0 .372.194.372.425 0 .219-.109.425-.358.426-.242 0-.375-.197-.375-.419 0-.235.108-.432.36-.432zm5.545 0c.25 0 .372.194.372.425 0 .219-.108.425-.358.426-.242 0-.374-.197-.374-.419 0-.235.108-.432.36-.432z"/></svg>`,
    ),
  },
};

const providerBrandMap: Record<string, keyof typeof logoByBrand> = {
  active_directory: "microsoftWindows",
  intune: "microsoftIntune",
  microsoft_365_admin_center: "microsoft365AdminCenter",
  microsoft_entra: "microsoftAzure",
  microsoft_exchange_admin_center: "microsoftExchange",
  microsoft_sharepoint: "microsoftSharePoint",
  microsoft_teams: "microsoftTeams",
  verizon_wireless: "verizon",
  zoho: "zoho",
  zoom: "zoom",
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "??";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function IntegrationLogo({ providerId, providerName, size = "md" }: IntegrationLogoProps) {
  const brand = providerBrandMap[providerId];
  const logo = brand ? logoByBrand[brand] : undefined;

  return (
    <div
      aria-hidden="true"
      className="d-flex flex-shrink-0 align-items-center justify-content-center border bg-white shadow-sm"
      title={`${providerName} logo`}
      style={{
        width: `${boxSizes[size]}px`,
        height: `${boxSizes[size]}px`,
        borderRadius: sizeClasses[size],
      }}
    >
      {logo ? (
        <img
          alt=""
          draggable={false}
          src={logo.src}
          style={{ width: `${imageSizes[size]}px`, height: `${imageSizes[size]}px` }}
        />
      ) : (
        <span className="small fw-semibold text-uppercase text-body-emphasis">
          {initialsFromName(providerName)}
        </span>
      )}
    </div>
  );
}
