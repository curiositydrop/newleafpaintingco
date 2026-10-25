(async function(){
  const headerMount=document.getElementById("global-header");
  const footerMount=document.getElementById("global-footer");
  if(!headerMount && !footerMount) return;
  try{
    const res=await fetch("global.html",{cache:"no-store"});
    if(!res.ok) throw new Error("Failed to load global.html");
    const html=await res.text();
    const temp=document.createElement("div");
    temp.innerHTML=html;

    const header=temp.querySelector("header");
    const topbar=temp.querySelector(".topbar");
    const footer=temp.querySelector("footer");
    const contactBtn=temp.querySelector("#contact-btn");
    const popup=temp.querySelector("#contact-popup");

    if(headerMount && header) headerMount.replaceChildren(...[topbar,header].filter(Boolean));
    if(footerMount && footer) footerMount.replaceChildren(footer);

    document.querySelectorAll("#contact-btn,#contact-popup").forEach(el=>el.remove());
    if(contactBtn) document.body.appendChild(contactBtn);
    if(popup) document.body.appendChild(popup);

    const current=(location.pathname.split("/").pop()||"index.html").toLowerCase();
    document.querySelectorAll(".nav-links a").forEach(a=>{
      const href=(a.getAttribute("href")||"").split("?")[0].toLowerCase();
      if(href===current || (current==="" && href==="index.html")){a.classList.add("active");a.setAttribute("aria-current","page");}
    });

    document.querySelectorAll('input[type="date"][name="Preferred Date"]').forEach(input=>{const d=new Date();const localDate=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);input.min=localDate;});

    const nav=document.querySelector(".nav-links");
    const menuToggle=document.querySelector(".menu-toggle");
    menuToggle?.addEventListener("click",()=>{const isOpen=nav?.classList.toggle("open");menuToggle.setAttribute("aria-expanded",String(Boolean(isOpen)));});
    nav?.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>{nav.classList.remove("open");menuToggle?.setAttribute("aria-expanded","false");}));

    const livePopup=document.getElementById("contact-popup");
    let priorFocus=null;
    const open=ev=>{ev?.preventDefault();priorFocus=document.activeElement;if(livePopup){livePopup.style.display="flex";livePopup.querySelector(".close")?.focus();}};
    const close=()=>{if(livePopup?.style.display==="flex"){livePopup.style.display="none";priorFocus?.focus?.();}};
    document.querySelectorAll('[data-contact-open="1"],#contact-btn').forEach(el=>el.addEventListener("click",open));
    livePopup?.querySelector(".close")?.addEventListener("click",close);
    window.addEventListener("click",e=>{if(e.target===livePopup) close();});
    window.addEventListener("keydown",e=>{if(e.key==="Escape") close();if(e.key==="Tab"&&livePopup?.style.display==="flex"){const focusable=[...livePopup.querySelectorAll("button,input,select,textarea,a[href]")].filter(el=>!el.disabled);if(focusable.length){const first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}});
  }catch(err){console.error(err);}
})();