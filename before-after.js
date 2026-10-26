/* Accessible before/after comparison: activate only with verified photos of the same job.
   Markup:
   <div class="before-after" data-before-after>
     <img class="comparison-after" src="AFTER.jpg" alt="Finished project">
     <div class="comparison-before"><img src="BEFORE.jpg" alt="Same project before work"></div>
     <input type="range" min="0" max="100" value="50" aria-label="Reveal before and after" />
     <span class="comparison-handle" aria-hidden="true"></span>
     <span class="comparison-label comparison-label-before">Before</span>
     <span class="comparison-label comparison-label-after">After</span>
   </div>
*/
document.querySelectorAll('[data-before-after]').forEach(compare => {
  const slider = compare.querySelector('input[type="range"]');
  if (!slider) return;
  const update = () => compare.style.setProperty('--reveal', slider.value + '%');
  slider.addEventListener('input', update);
  update();
});
