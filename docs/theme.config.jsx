export default {
  logo: <span>Keygate</span>,
  project: {
    link: "https://github.com/keygate-vault/multisignature",
  },
  primaryHue: {
    dark: 265, // This matches with the purple hue of #A166FF
    light: 265,
  },
  useNextSeoProps() {
    return {
      titleTemplate: "%s – Keygate",
    };
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="Keygate documentation" />
    </>
  ),
  darkMode: true,
  theme: {
    colors: {
      dark: {
        primary: "#A166FF",
        background: "#1B1B1D",
        card: "#3A3644",
        text: "#CFBBFF",
        border: "#635B7C",
      },
      light: {
        primary: "#A166FF",
        background: "#FFFFFF",
        card: "#F5F5F5",
        text: "#000000",
        border: "#BE9CFF",
      },
    },
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  footer: {
    text: `${new Date().getFullYear()} © Keygate.`,
  },
  docsRepositoryBase:
    "https://github.com/keygate-vault/multisignature/tree/main",
};
