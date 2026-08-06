window.LIFE_OS_SECRETARY_CONFIG = {
  snapshotUrl: "",
  headers: {},
  finance: {
    spreadsheetId: "15BsyIn4eglomCan8By63l1RV-3bTAY8Hkcy1xuyInLY",
    autoRefreshMs: 300000,
    tabs: {
      summary: "",
      operations: "https://docs.google.com/spreadsheets/d/15BsyIn4eglomCan8By63l1RV-3bTAY8Hkcy1xuyInLY/gviz/tq?tqx=out:csv&gid=1009",
      accounts: "",
      payments: "",
      debts: "",
      goals: ""
    },
    headers: {}
  }
};

/* Final contrast override. Loaded in <head>, after the page stylesheet. */
(() => {
  const style = document.createElement("style");
  style.id = "life-os-final-contrast";
  style.textContent = `
    .topbar h1{color:#f4ead8!important}
    .topbar .nav-btn{color:rgba(244,234,216,.78)!important}
    .topbar .nav-btn.active{color:#efc36f!important;background:rgba(185,138,79,.16)!important;box-shadow:inset 0 0 0 1px rgba(239,195,111,.38)!important}
    .hq-hero{color:#f6ead8!important}
    .hq-hero .hero-metric strong,
    .hq-hero .progress-card b,
    .hq-hero .progress-value,
    .hq-hero .ring-hour,
    .hq-hero .ring-center,
    .hq-hero .weekday,
    .hq-hero .month-label,
    .hq-hero .day-number{color:#f6ead8!important}
    .hq-hero .hero-metric span{color:rgba(246,234,216,.72)!important}
    .hq-hero .time-pill{color:#17120d!important}
  `;
  document.head.appendChild(style);
})();
