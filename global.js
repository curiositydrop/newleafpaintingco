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

    const topbar=temp.querySelector(".topbar");
    const header=temp.querySelector("header");
    const footer=temp.querySelector("footer");
    const contactBtn=temp.querySelector("#contact-btn");
    const popup=temp.querySelector("#contact-popup");

    if(headerMount && header){
      const frag=document.createDocumentFragment();
      if(topbar) frag.appendChild(topbar);
      frag.appendChild(header);
      headerMount.replaceChildren(frag);
    }
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
    document.querySelector(".menu-toggle")?.addEventListener("click",()=>{
      const open=nav?.classList.toggle("open");
      document.querySelector(".menu-toggle")?.setAttribute("aria-expanded", open ? "true" : "false");
    });

    const livePopup=document.getElementById("contact-popup");
    const open=ev=>{
      ev?.preventDefault();
      if(!livePopup) return;
      const message=ev?.currentTarget?.getAttribute?.("data-book-message");
      const details=livePopup.querySelector('[name="Project Details"]');
      if(details && message) details.value=message;
      livePopup.style.display="flex";
    };
    if(location.hash==="#walkthrough") open({preventDefault(){}, currentTarget:{getAttribute:()=>"Whole-home walkthrough"}});
    const close=()=>{if(livePopup) livePopup.style.display="none";};
    document.querySelectorAll('[data-contact-open="1"],#contact-btn').forEach(el=>el.addEventListener("click",open));
    document.querySelectorAll("form[name='in-person-estimate']").forEach(form=>{
      form.addEventListener("submit", event=>{
        const picked=form.querySelectorAll('input[name="Service"]:checked');
        const note=form.querySelector(".service-error");
        if(!picked.length){ event.preventDefault(); if(note) note.hidden=false; }
        else if(note) note.hidden=true;
      });
    });
    livePopup?.querySelector(".close")?.addEventListener("click",close);
    window.addEventListener("click",e=>{if(e.target===livePopup) close();});
    window.addEventListener("keydown",e=>{if(e.key==="Escape") close();});
  }catch(err){console.error(err);}
})();