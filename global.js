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
    const footer=temp.querySelector("footer");
    const contactBtn=temp.querySelector("#contact-btn");
    const popup=temp.querySelector("#contact-popup");

    if(headerMount && header) headerMount.replaceChildren(header);
    if(footerMount && footer) footerMount.replaceChildren(footer);

    document.querySelectorAll("#contact-btn,#contact-popup").forEach(el=>el.remove());
    if(contactBtn) document.body.appendChild(contactBtn);
    if(popup) document.body.appendChild(popup);

    const current=(location.pathname.split("/").pop()||"index.html").toLowerCase();
    document.querySelectorAll(".nav-links a").forEach(a=>{
      const href=(a.getAttribute("href")||"").split("?")[0].toLowerCase();
      if(href===current || (current==="" && href==="index.html")) a.classList.add("active");
    });

    const nav=document.querySelector(".nav-links");
    document.querySelector(".menu-toggle")?.addEventListener("click",()=>nav?.classList.toggle("open"));

    const livePopup=document.getElementById("contact-popup");
    const open=ev=>{ev?.preventDefault();if(livePopup) livePopup.style.display="flex";};
    const close=()=>{if(livePopup) livePopup.style.display="none";};
    document.querySelectorAll('[data-contact-open="1"],#contact-btn').forEach(el=>el.addEventListener("click",open));
    livePopup?.querySelector(".close")?.addEventListener("click",close);
    window.addEventListener("click",e=>{if(e.target===livePopup) close();});
    window.addEventListener("keydown",e=>{if(e.key==="Escape") close();});
  }catch(err){console.error(err);}
})();