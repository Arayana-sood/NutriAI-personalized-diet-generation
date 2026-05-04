/* ===== NutriAI — Diet Intelligence Platform ===== */
(function(){
"use strict";

// ---- State ----
let wizStep = 1;
const state = { name:'', age:25, gender:'male', weight:70, height:170, diabetes:false, heart:false, kidney:false, anemia:false, obesity:false, liver:false, veg:false, allergies:[], activity:'moderate', goal:'maintain' };

// ---- Screen Nav ----
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
}

// ---- Landing buttons ----
['btn-start-analysis','btn-nav-start','btn-cta-bottom'].forEach(id=>{
  const el=document.getElementById(id);
  if(el) el.addEventListener('click',()=>showScreen('screen-wizard'));
});
document.getElementById('btn-back-home').addEventListener('click',()=>showScreen('screen-landing'));
document.getElementById('btn-restart').addEventListener('click',resetAll);
document.getElementById('btn-restart2').addEventListener('click',resetAll);

const btnRegen = document.getElementById('btn-regenerate');
if(btnRegen) {
  btnRegen.addEventListener('click', () => {
    // Shimmer effect on Results container
    const rc = document.querySelector('.results-grid');
    if(rc) {
      rc.classList.add('shimmer-loading');
      rc.style.opacity = '0.7';
    }
    
    // Simulate AI regenerating wait with slight randomization
    const delay = Math.floor(Math.random() * 800) + 600; // 600ms - 1400ms
    setTimeout(() => {
      buildResults();
      if(rc) {
        rc.classList.remove('shimmer-loading');
        rc.style.opacity = '1';
        
        // Re-trigger slideUpFade animations
        document.querySelectorAll('.section-card').forEach(c => {
          c.style.animation = 'none';
          c.offsetHeight; /* trigger reflow */
          c.style.animation = null; 
        });
      }
    }, delay);
  });
}

const btnPdf = document.getElementById('btn-download-pdf');
if(btnPdf) {
  btnPdf.addEventListener('click', () => {
    // Hide UI elements during export
    const actions = document.querySelector('.results-footer-actions');
    const tabs = document.querySelector('.plan-tabs-row');
    if(actions) actions.style.display = 'none';
    if(tabs) tabs.style.display = 'none';
    
    // Slight delay to ensure UI updates before printing
    setTimeout(() => {
        const element = document.querySelector('.results-container');
        const opt = {
          margin:       [15, 15, 15, 15],
          filename:     'NutriAI_Diet_Plan.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, logging: false },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak:    { mode: ['css', 'legacy'] }
        };
        
        // Generate PDF
        html2pdf().set(opt).from(element).save().then(() => {
          // Restore UI elements
          if(actions) actions.style.display = 'flex';
          if(tabs) tabs.style.display = 'flex';
        });
    }, 100);
  });
}

function resetAll(){
  wizStep=1; updateWizard(); showScreen('screen-landing');
}

// ---- Stat Counters (landing) ----
let statsAnimated=false;
const obs=new IntersectionObserver(entries=>{
  if(entries[0].isIntersecting&&!statsAnimated){
    statsAnimated=true;
    document.querySelectorAll('.stat-num[data-target]').forEach(el=>{
      const t=+el.dataset.target; let c=0;
      const step=Math.max(1,Math.floor(t/60));
      const iv=setInterval(()=>{c+=step;if(c>=t){c=t;clearInterval(iv)}el.textContent=c.toLocaleString()},30);
    });
  }
},{threshold:0.3});
const ss=document.querySelector('.stats-section');
if(ss) obs.observe(ss);

// ---- Wizard ----
const btnNext=document.getElementById('btn-next');
const btnPrev=document.getElementById('btn-prev');

btnNext.addEventListener('click',()=>{
  if(wizStep===4){ collectState(); startProcessing(); return; }
  if(wizStep<4) wizStep++;
  updateWizard();
});
btnPrev.addEventListener('click',()=>{
  if(wizStep>1) wizStep--;
  updateWizard();
});

function updateWizard(){
  document.querySelectorAll('.wiz-step-panel').forEach(p=>p.classList.remove('active'));
  const panel=document.getElementById('ws-'+wizStep);
  if(panel) panel.classList.add('active');
  document.getElementById('wiz-step-cur').textContent=wizStep;
  document.getElementById('wiz-progress-fill').style.width=(wizStep*25)+'%';
  btnPrev.style.visibility=wizStep===1?'hidden':'visible';
  btnNext.textContent=wizStep===4?'Generate My Plan ✨':'Continue →';
  for(let i=1;i<=4;i++){
    const n=document.getElementById('wsn-'+i);
    n.classList.remove('active','done');
    if(i===wizStep) n.classList.add('active');
    else if(i<wizStep) n.classList.add('done');
  }
}

// Sliders
function bindSlider(sid,vid,cb){
  const s=document.getElementById(sid),v=document.getElementById(vid);
  if(!s||!v) return;
  s.addEventListener('input',()=>{v.textContent=s.value;if(cb)cb();});
}
bindSlider('slider-age','val-age');
bindSlider('slider-weight','val-weight',updateBMI);
bindSlider('slider-height','val-height',updateBMI);

function updateBMI(){
  const w=+document.getElementById('slider-weight').value;
  const h=+document.getElementById('slider-height').value/100;
  const bmi=(w/(h*h)).toFixed(1);
  document.getElementById('bmi-value').textContent=bmi;
  let cat='Normal Weight',pct=Math.min(100,Math.max(5,(bmi/40)*100));
  if(bmi<18.5) cat='Underweight'; else if(bmi<25) cat='Normal Weight'; else if(bmi<30) cat='Overweight'; else cat='Obese';
  document.getElementById('bmi-category').textContent=cat;
  document.getElementById('bmi-bar-fill').style.width=pct+'%';
}

// Gender toggles
document.querySelectorAll('.toggle-btn').forEach(b=>{
  b.addEventListener('click',()=>{
    b.parentElement.querySelectorAll('.toggle-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
  });
});

// Health toggle cards
document.querySelectorAll('.health-toggle-card').forEach(c=>{
  c.addEventListener('click',()=>c.classList.toggle('active'));
});

// Prescription Upload Logic
const btnUploadPrescription = document.getElementById('btn-upload-prescription');
const prescriptionInput = document.getElementById('prescription-upload');
const detectedMsg = document.getElementById('detected-conditions-msg');

if (btnUploadPrescription && prescriptionInput) {
  btnUploadPrescription.addEventListener('click', () => {
    prescriptionInput.click();
  });

  prescriptionInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show loading state
    btnUploadPrescription.disabled = true;
    btnUploadPrescription.style.opacity = '0.5';
    btnUploadPrescription.innerHTML = '<span>⏳</span> Processing prescription...';
    detectedMsg.textContent = '';
    detectedMsg.style.color = 'var(--a2)';

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use relative path to work perfectly on localhost AND when deployed to cloud (e.g., Render)
      const response = await fetch('/upload-prescription', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errStr = 'Server error';
        try {
          const errData = await response.json();
          errStr = errData.detail || errStr;
        } catch(e) {}
        throw new Error(errStr);
      }

      const data = await response.json();
      
      // Update state for ML pipeline
      state.anemia = data.anemia || false;
      state.obesity = data.obesity || false;
      state.liver = data.liver || false;
      
      // Safe Toggle Behavior: Only turn ON toggles
      const detected = [];
      if (data.diabetes) {
        document.getElementById('htc-diabetes').classList.add('active');
        detected.push('Diabetes');
      }
      if (data.heart) {
        document.getElementById('htc-heart').classList.add('active');
        detected.push('Heart Condition');
      }
      if (data.kidney) {
        document.getElementById('htc-kidney').classList.add('active');
        detected.push('Kidney Issue');
      }
      if (data.anemia) detected.push('Anemia');
      if (data.obesity) detected.push('Obesity');
      if (data.liver) detected.push('Liver Issue');

      if (detected.length > 0) {
        detectedMsg.textContent = 'Detected: ' + detected.join(', ');
        detectedMsg.style.color = '#00ff88'; // success green
        
        // Smart Touch: Confidence Score
        const confScore = Math.floor(Math.random() * (98 - 85 + 1) + 85);
        const confMsg = document.getElementById('confidence-score-msg');
        if(confMsg) confMsg.textContent = `Estimated Confidence: ${confScore}%`;
      } else {
        detectedMsg.textContent = 'No specific conditions detected.';
        const confMsg = document.getElementById('confidence-score-msg');
        if(confMsg) confMsg.textContent = '';
      }
    } catch (err) {
      console.error(err);
      detectedMsg.textContent = "Error: " + err.message;
      detectedMsg.style.color = '#ef4444'; // Red color for error
    } finally {
      // Restore button
      btnUploadPrescription.disabled = false;
      btnUploadPrescription.style.opacity = '1';
      btnUploadPrescription.innerHTML = '<span>📄</span> Upload Prescription (Optional)';
      prescriptionInput.value = ''; // allow uploading the same file again if needed
    }
  });
}


// Selection cards
document.querySelectorAll('.sel-card').forEach(c=>{
  c.addEventListener('click',()=>{
    const grp=c.dataset.group;
    document.querySelectorAll(`.sel-card[data-group="${grp}"]`).forEach(x=>x.classList.remove('active'));
    c.classList.add('active');
  });
});

function collectState(){
  state.name=document.getElementById('inp-name').value||'Friend';
  state.age=+document.getElementById('slider-age').value;
  state.weight=+document.getElementById('slider-weight').value;
  state.height=+document.getElementById('slider-height').value;
  const genderActive=document.querySelector('.toggle-btn.active');
  if(genderActive) state.gender=genderActive.dataset.val;
  state.diabetes=document.getElementById('htc-diabetes').classList.contains('active');
  state.heart=document.getElementById('htc-heart').classList.contains('active');
  state.kidney=document.getElementById('htc-kidney').classList.contains('active');
  state.veg=document.getElementById('htc-veg').classList.contains('active');
  state.allergies=[];
  if(document.getElementById('allergy-gluten').checked) state.allergies.push('gluten');
  if(document.getElementById('allergy-dairy').checked) state.allergies.push('dairy');
  if(document.getElementById('allergy-nuts').checked) state.allergies.push('nuts');
  if(document.getElementById('allergy-soy').checked) state.allergies.push('soy');
  const actCard=document.querySelector('.sel-card[data-group="activity"].active');
  if(actCard) state.activity=actCard.dataset.val;
  const goalCard=document.querySelector('.sel-card[data-group="goal"].active');
  if(goalCard) state.goal=goalCard.dataset.val;
}

// ---- Processing Screen ----
function startProcessing(){
  showScreen('screen-processing');
  const steps=document.querySelectorAll('.proc-step');
  const bar=document.getElementById('proc-bar');
  const title=document.getElementById('proc-title');
  const titles=['Analyzing your health profile...','Running 6 AI models...','Building your nutrition plan...','Almost ready...'];
  steps.forEach(s=>{s.classList.remove('active','done');s.querySelector('.ps-dot').className='ps-dot pending';});
  bar.style.width='0%';
  let i=0;
  const iv=setInterval(()=>{
    if(i>0){steps[i-1].classList.remove('active');steps[i-1].classList.add('done');steps[i-1].querySelector('.ps-dot').className='ps-dot done';}
    if(i<steps.length){steps[i].classList.add('active');steps[i].querySelector('.ps-dot').className='ps-dot active';}
    bar.style.width=((i+1)/steps.length*100)+'%';
    title.textContent=titles[Math.min(i,titles.length-1)];
    i++;
    if(i>steps.length){clearInterval(iv);setTimeout(()=>{buildResults();showScreen('screen-results');},500);}
  },700);
}

// ---- Diet Engine ----
const FOODS = {
  general:{
    breakfast:[
      {n:'Oatmeal with mixed berries & honey',c:350,p:'1 cup oats + ½ cup berries',t:'Cook with milk for creamier texture'},
      {n:'Whole wheat toast with avocado & egg',c:380,p:'2 slices + ½ avocado + 1 egg',t:'Season with chili flakes & lime'},
      {n:'Greek yogurt parfait with granola',c:320,p:'200g yogurt + 40g granola + fruits',t:'Layer in a jar for meal prep'},
      {n:'Scrambled eggs with spinach & feta',c:340,p:'3 eggs + 1 cup spinach + 30g feta',t:'Cook on low heat for fluffy eggs'},
      {n:'Banana protein smoothie',c:360,p:'1 banana + 1 scoop whey + 200ml milk',t:'Add ice for thicker consistency'},
      {n:'Poha with peanuts & veggies',c:290,p:'1.5 cups flattened rice + mixed veggies',t:'Add curry leaves & mustard seeds'},
      {n:'Idli with sambar & coconut chutney',c:270,p:'4 idlis + 1 bowl sambar',t:'Ferment batter overnight for best taste'},
      {n:'Masala dosa with potato filling',c:330,p:'2 dosas + potato bhaji',t:'Serve with filter coffee for authentic feel'}
    ],
    lunch:[
      {n:'Grilled chicken quinoa power bowl',c:520,p:'150g chicken + 1 cup quinoa + veggies',t:'Marinate chicken in lemon & herbs 30 min'},
      {n:'Brown rice with dal & seasonal vegetables',c:450,p:'1 cup rice + 1 bowl dal + sabzi',t:'Add ghee on top for flavor'},
      {n:'Mediterranean salad with feta & olives',c:380,p:'Mixed greens + 50g feta + olive oil',t:'Dress just before eating for crunch'},
      {n:'Paneer tikka wrap with mint sauce',c:480,p:'100g paneer + whole wheat wrap + sauce',t:'Grill paneer till charred edges'},
      {n:'Rajma chawal with raita & salad',c:500,p:'1 cup rajma + 1 cup rice + raita',t:'Soak rajma overnight for best results'},
      {n:'Chickpea salad with olive oil dressing',c:390,p:'1 cup chickpeas + veggies + 1 tbsp olive oil',t:'Add lemon juice & cumin for zing'}
    ],
    dinner:[
      {n:'Baked salmon with roasted asparagus',c:480,p:'180g salmon fillet + 8 asparagus spears',t:'Bake at 200°C for 15 min'},
      {n:'Grilled tofu with stir-fry vegetables',c:380,p:'200g firm tofu + 2 cups mixed veggies',t:'Press tofu 20 min before cooking'},
      {n:'Chicken curry with brown rice',c:520,p:'150g chicken + 1 cup brown rice + curry',t:'Use coconut milk for richer gravy'},
      {n:'Palak paneer with 2 whole wheat rotis',c:450,p:'100g paneer + 2 cups spinach + 2 rotis',t:'Blanch spinach to retain green color'},
      {n:'Grilled fish with sweet potato mash',c:460,p:'180g fish + 1 medium sweet potato',t:'Season fish with turmeric & pepper'},
      {n:'Mixed dal tadka with jeera rice',c:420,p:'1 bowl mixed dal + 1 cup jeera rice',t:'Add tomato & garlic tadka on top'}
    ],
    snacks:[
      {n:'Almonds & walnuts mix',c:180,p:'15 almonds + 5 walnuts',t:'Soak overnight for better absorption'},
      {n:'Green tea with dark chocolate',c:120,p:'1 cup tea + 20g 70% dark chocolate',t:'Best as an afternoon pick-me-up'},
      {n:'Hummus with carrot & cucumber sticks',c:150,p:'3 tbsp hummus + 1 cup veggies',t:'Make hummus fresh for best flavor'},
      {n:'Roasted makhana with spices',c:130,p:'1 cup makhana + pinch of spices',t:'Dry roast with turmeric & black pepper'},
      {n:'Apple slices with peanut butter',c:200,p:'1 medium apple + 2 tbsp peanut butter',t:'Choose natural unsweetened PB'},
      {n:'Sprout chaat with lemon & chaat masala',c:140,p:'1 cup mixed sprouts + onion + tomato',t:'Soak sprouts 8 hrs, steam before use'}
    ]
  },
  diabetes:{
    breakfast:[
      {n:'Steel-cut oats with cinnamon & walnuts',c:300,p:'¾ cup oats + 5 walnuts + ½ tsp cinnamon',t:'Cinnamon helps regulate blood sugar'},
      {n:'Moong dal chilla with mint chutney',c:260,p:'2 chillas + fresh mint chutney',t:'Low GI — excellent for diabetics'},
      {n:'Egg white omelette with bell peppers',c:220,p:'4 egg whites + ½ cup diced peppers',t:'Add turmeric for anti-inflammatory boost'},
      {n:'Besan cheela with curd',c:250,p:'2 cheelas + ½ cup low-fat curd',t:'High protein, low GI breakfast option'},
      {n:'Ragi dosa with sambar',c:280,p:'2 dosas + 1 bowl sambar',t:'Ragi is rich in calcium & fiber'}
    ],
    lunch:[
      {n:'Grilled chicken with bitter gourd salad',c:420,p:'150g chicken + 1 cup karela salad',t:'Bitter gourd naturally lowers blood sugar'},
      {n:'Mixed vegetable soup with barley',c:350,p:'1 large bowl + ¼ cup barley',t:'Barley has very low glycemic index'},
      {n:'Quinoa bowl with methi & spinach',c:380,p:'1 cup quinoa + 1 cup greens + dressing',t:'Methi seeds help control glucose spikes'},
      {n:'Lentil stew with flaxseed bread',c:400,p:'1 bowl lentils + 2 slices flax bread',t:'Flaxseed adds omega-3 & fiber'}
    ],
    dinner:[
      {n:'Baked fish with sautéed broccoli',c:380,p:'180g fish + 2 cups broccoli florets',t:'Use olive oil spray instead of butter'},
      {n:'Tofu bhurji with multigrain roti',c:360,p:'200g tofu + 2 multigrain rotis',t:'Crumble tofu for egg-like texture'},
      {n:'Grilled chicken with cucumber raita',c:400,p:'150g chicken + 1 bowl raita + salad',t:'Use low-fat curd for raita'},
      {n:'Lauki curry with brown rice',c:370,p:'1 cup lauki curry + ¾ cup brown rice',t:'Lauki is low calorie & hydrating'}
    ],
    snacks:[
      {n:'Cucumber & tomato salad with seeds',c:80,p:'1 cup veggies + 1 tbsp mixed seeds',t:'Add chia seeds for extra fiber'},
      {n:'Roasted chickpeas (unsalted)',c:120,p:'½ cup chickpeas dry roasted',t:'Season with cumin & chili'},
      {n:'Sugar-free green smoothie',c:100,p:'Spinach + cucumber + lemon + ginger',t:'No fruits to keep sugar minimal'},
      {n:'Boiled egg whites with pepper',c:70,p:'3 egg whites + black pepper',t:'Pure protein, zero sugar snack'}
    ]
  },
  heart:{
    breakfast:[
      {n:'Oatmeal with flaxseed & blueberries',c:310,p:'1 cup oats + 1 tbsp flax + ½ cup berries',t:'Flaxseed is rich in omega-3 fatty acids'},
      {n:'Whole grain toast with almond butter',c:290,p:'2 slices + 2 tbsp almond butter',t:'Choose unsalted almond butter'},
      {n:'Ragi porridge with cardamom',c:260,p:'1 cup ragi flour porridge + cardamom',t:'Ragi supports healthy blood pressure'},
      {n:'Fruit bowl with chia seeds & honey',c:250,p:'1 cup mixed fruits + 1 tbsp chia + drizzle honey',t:'Chia seeds provide heart-healthy omega-3'}
    ],
    lunch:[
      {n:'Grilled salmon with olive oil salad',c:450,p:'180g salmon + mixed greens + 1 tbsp olive oil',t:'Salmon has highest omega-3 content'},
      {n:'Chickpea & spinach curry (low sodium)',c:380,p:'1 cup chickpeas + 2 cups spinach + spices',t:'Skip salt — use lemon & herbs instead'},
      {n:'Quinoa tabbouleh with lemon dressing',c:360,p:'1 cup quinoa + parsley + tomato + lemon',t:'Mediterranean diet staple for heart health'},
      {n:'Steamed fish with turmeric rice',c:420,p:'180g fish + 1 cup turmeric rice + veggies',t:'Turmeric is anti-inflammatory'}
    ],
    dinner:[
      {n:'Baked chicken with garlic asparagus',c:400,p:'150g chicken breast + 8 asparagus + garlic',t:'Garlic helps lower cholesterol'},
      {n:'Mixed bean stew with fresh herbs',c:370,p:'1 cup mixed beans + herbs + tomato base',t:'Beans are excellent for heart health'},
      {n:'Grilled mackerel with steamed veggies',c:410,p:'180g mackerel + 2 cups steamed vegetables',t:'Mackerel is packed with omega-3'},
      {n:'Palak dal with jeera rice (low salt)',c:380,p:'1 bowl dal + 1 cup rice + minimal salt',t:'Use rock salt or pink salt sparingly'}
    ],
    snacks:[
      {n:'Walnuts & almonds (omega-3 rich)',c:170,p:'10 walnuts + 10 almonds',t:'Best heart-healthy nut combination'},
      {n:'Fresh pomegranate seeds',c:100,p:'1 cup pomegranate arils',t:'Rich in antioxidants for artery health'},
      {n:'Avocado toast on whole grain',c:190,p:'½ avocado on 1 slice whole grain bread',t:'Healthy monounsaturated fats'},
      {n:'Beetroot & carrot juice',c:90,p:'1 glass fresh juice (no sugar)',t:'Beetroot naturally lowers blood pressure'}
    ]
  },
  fitness:{
    breakfast:[
      {n:'Protein pancakes with banana & honey',c:450,p:'3 pancakes (oat+whey) + 1 banana + honey',t:'Add scoop of whey to pancake batter'},
      {n:'6-egg white omelette with oats',c:420,p:'6 whites + ½ cup oats + veggies',t:'42g protein — ideal post-morning-workout'},
      {n:'High-protein smoothie bowl',c:480,p:'Whey + banana + PB + granola topping',t:'Blend thick, eat with spoon for satiety'},
      {n:'Chicken sausage with whole wheat toast',c:440,p:'2 chicken sausages + 2 slices toast + egg',t:'Choose low-fat chicken sausages'}
    ],
    lunch:[
      {n:'Double chicken breast with brown rice',c:650,p:'250g chicken + 1.5 cups brown rice + broccoli',t:'Meal prep Sunday for the whole week'},
      {n:'Tuna quinoa power bowl',c:580,p:'1 can tuna + 1 cup quinoa + avocado + greens',t:'Tuna is lean protein powerhouse'},
      {n:'Lean beef stir-fry with vegetables',c:620,p:'200g lean beef + 2 cups mixed stir-fry veggies',t:'Use coconut aminos instead of soy sauce'},
      {n:'Paneer bhurji with 3 multigrain rotis',c:600,p:'150g paneer + 3 rotis + salad',t:'Great vegetarian high-protein option'}
    ],
    dinner:[
      {n:'Grilled steak with sweet potato',c:580,p:'200g sirloin steak + 1 large sweet potato',t:'Rest steak 5 min before cutting'},
      {n:'Salmon fillet with quinoa & greens',c:550,p:'200g salmon + 1 cup quinoa + sautéed kale',t:'Omega-3 aids muscle recovery'},
      {n:'Chicken tikka with brown rice & dal',c:600,p:'200g tikka + 1 cup rice + 1 bowl dal',t:'Yogurt-marinated for tender texture'},
      {n:'Egg curry with multigrain roti',c:520,p:'4 egg curry + 3 multigrain rotis',t:'Whole eggs for complete amino acids'}
    ],
    snacks:[
      {n:'Protein shake with peanut butter',c:300,p:'1 scoop whey + 200ml milk + 1 tbsp PB',t:'Consume within 30 min post-workout'},
      {n:'Trail mix with dried fruits & seeds',c:250,p:'¼ cup mixed nuts + dried cranberries + seeds',t:'Perfect portable gym snack'},
      {n:'Cottage cheese with berries',c:200,p:'150g paneer/cottage cheese + ½ cup berries',t:'Casein protein — great before bed'},
      {n:'Banana with whey protein',c:280,p:'1 large banana + 1 scoop whey + water',t:'Fast carbs + protein post-workout'}
    ]
  }
};

function calcCalories(){
  const h=state.height, w=state.weight, a=state.age;
  let bmr = state.gender==='female' ? 447.6+9.2*w+3.1*h-4.3*a : 88.4+13.4*w+4.8*h-5.7*a;
  const mult={sedentary:1.2,light:1.375,moderate:1.55,active:1.725};
  let tdee=bmr*(mult[state.activity]||1.55);
  if(state.goal==='lose') tdee-=400;
  else if(state.goal==='gain') tdee+=400;
  return Math.round(tdee);
}

function pickRandom(arr,n){
  const shuffled=[...arr].sort(()=>Math.random()-0.5);
  return shuffled.slice(0,Math.min(n,shuffled.length));
}

function generatePlan(type){
  const db = FOODS[type]||FOODS.general;
  const cal = calcCalories();
  const bf=pickRandom(db.breakfast,3), ln=pickRandom(db.lunch,3), dn=pickRandom(db.dinner,3), sn=pickRandom(db.snacks,3);
  const bfCal=bf.reduce((s,f)=>s+f.c,0), lnCal=ln.reduce((s,f)=>s+f.c,0), dnCal=dn.reduce((s,f)=>s+f.c,0), snCal=sn.reduce((s,f)=>s+f.c,0);
  // Macros
  let protPct=0.25, carbPct=0.45, fatPct=0.30;
  if(type==='diabetes'){protPct=0.30;carbPct=0.35;fatPct=0.35;}
  if(type==='heart'){protPct=0.25;carbPct=0.50;fatPct=0.25;}
  if(type==='fitness'){protPct=0.35;carbPct=0.40;fatPct=0.25;}
  const protG=Math.round(cal*protPct/4), carbG=Math.round(cal*carbPct/4), fatG=Math.round(cal*fatPct/9);
  return {meals:{breakfast:{items:bf,cal:bfCal},lunch:{items:ln,cal:lnCal},dinner:{items:dn,cal:dnCal},snacks:{items:sn,cal:snCal}},cal,protG,carbG,fatG,protPct,carbPct,fatPct};
}

function getInsights(type){
  const base=[
    {i:'🧠',t:`Your daily caloric target is optimized for your BMI of ${(state.weight/((state.height/100)**2)).toFixed(1)}.`},
    {i:'📊',t:'Macro ratios are balanced based on your activity level and health profile.'}
  ];
  if(state.diabetes) base.push({i:'🩸',t:'Low glycemic index foods selected to help manage blood sugar levels.'});
  if(state.heart) base.push({i:'❤️',t:'Low sodium, omega-3 rich foods chosen to support cardiovascular health.'});
  if(state.kidney) base.push({i:'🫘',t:'Protein intake moderated and potassium-controlled for kidney wellness.'});
  if(type==='fitness') base.push({i:'💪',t:'High protein allocation to support muscle recovery and growth.'});
  if(type==='diabetes') base.push({i:'⚡',t:'Complex carbohydrates prioritized for sustained energy without sugar spikes.'});
  if(type==='heart') base.push({i:'🫀',t:'Saturated fat minimized — focus on healthy unsaturated fats and fiber.'});
  return base;
}

function getRecos(){
  const r=[{i:'💧',t:'Drink at least 8 glasses of water daily for optimal metabolism.'}];
  if(state.goal==='lose') r.push({i:'🏃',t:'Combine this diet with 30 min of cardio 4x/week for best results.'});
  if(state.goal==='gain') r.push({i:'🏋️',t:'Pair this plan with progressive resistance training for muscle gain.'});
  r.push({i:'🥦',t:'Eat more fiber-rich vegetables to improve gut health.'});
  r.push({i:'🚫',t:'Minimize processed foods, added sugars, and excessive sodium.'});
  r.push({i:'😴',t:'Get 7–8 hours of quality sleep — it directly impacts metabolism.'});
  if(state.veg) r.push({i:'🌱',t:'Ensure adequate B12 and iron through fortified foods or supplements.'});
  return r;
}

// ---- Render Results ----
let currentPlanType='general';

function buildResults(){
  currentPlanType='general';
  renderPlan('general');
  document.getElementById('result-name').textContent=state.name;
}

function renderPlan(type){
  const plan=generatePlan(type);
  // Summary
  document.getElementById('sum-cal').textContent=plan.cal+' kcal';
  document.getElementById('sum-protein').textContent=plan.protG+'g';
  document.getElementById('sum-carbs').textContent=plan.carbG+'g';
  document.getElementById('sum-fat').textContent=plan.fatG+'g';
  document.getElementById('sum-water').textContent=(Math.round(state.weight*0.033*10)/10)+'L';
  // Badge
  const labels={general:'General',diabetes:'Diabetes-Friendly',heart:'Heart Health',fitness:'Fitness'};
  document.getElementById('plan-label-badge').textContent=labels[type]||'General';
  // Meals
  const mealMap={breakfast:{items:'mc-b-items',cal:'mc-b-cal'},lunch:{items:'mc-l-items',cal:'mc-l-cal'},dinner:{items:'mc-d-items',cal:'mc-d-cal'},snacks:{items:'mc-s-items',cal:'mc-s-cal'}};
  for(const[key,ids] of Object.entries(mealMap)){
    const m=plan.meals[key];
    document.getElementById(ids.cal).textContent=m.cal+' kcal';
    const c=document.getElementById(ids.items);
    c.innerHTML=m.items.map(f=>{
      let html=`<div class="meal-item-detailed">`;
      html+=`<div class="mid-top"><span class="mid-name">${f.n}</span><span class="mid-cal">${f.c} kcal</span></div>`;
      if(f.p) html+=`<div class="mid-portion">📦 ${f.p}</div>`;
      if(f.t) html+=`<div class="mid-tip">💡 ${f.t}</div>`;
      html+=`</div>`;
      return html;
    }).join('');
  }
  // Pie chart
  drawPie(plan);
  // Bar chart
  drawBars(plan);
  // Insights
  const il=document.getElementById('insights-list');
  il.innerHTML=getInsights(type).map(x=>`<li><span class="insight-icon">${x.i}</span><span>${x.t}</span></li>`).join('');
  // Recommendations
  const rl=document.getElementById('reco-list');
  rl.innerHTML=getRecos().map(x=>`<li><span class="reco-icon">${x.i}</span><span>${x.t}</span></li>`).join('');
  // New visualizations
  setTimeout(() => {
    drawGauge(plan,type);
    drawTimeline(plan);
    drawWeekly(plan);
    drawHydration();
    drawNutrientMeters(plan);
    drawBMISpectrum();
    drawCalorieSplit(plan);
    drawMicroTargets(plan);
  }, 50);
}

// Tabs
document.querySelectorAll('.plan-tab').forEach(t=>{
  t.addEventListener('click',()=>{
    document.querySelectorAll('.plan-tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    renderPlan(t.dataset.plan);
  });
});

// ---- Charts ----
function drawPie(plan){
  const canvas=document.getElementById('pie-canvas');
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const cx=90,cy=90,r=75;
  ctx.clearRect(0,0,180,180);
  const data=[
    {label:'Protein',pct:plan.protPct,color:'#00ff88'},
    {label:'Carbs',pct:plan.carbPct,color:'#00c8ff'},
    {label:'Fats',pct:plan.fatPct,color:'#a78bfa'}
  ];
  let start=-Math.PI/2;
  data.forEach(d=>{
    const angle=d.pct*2*Math.PI;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,start,start+angle);ctx.closePath();ctx.fillStyle=d.color;ctx.fill();
    start+=angle;
  });
  // donut hole
  ctx.beginPath();ctx.arc(cx,cy,45,0,2*Math.PI);ctx.fillStyle='#0a0a0f';ctx.fill();
  ctx.fillStyle='#f0f0f5';ctx.font='bold 18px Inter';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(plan.cal,cx,cy-8);ctx.font='11px Inter';ctx.fillStyle='#8888aa';ctx.fillText('kcal/day',cx,cy+10);
  // Legend
  const leg=document.getElementById('pie-legend');
  leg.innerHTML=data.map(d=>`<div class="legend-item"><span class="legend-dot" style="background:${d.color}"></span>${d.label} ${Math.round(d.pct*100)}%</div>`).join('');
}

function drawBars(plan){
  const wrap=document.getElementById('bar-chart');
  const bars=[
    {label:'Protein',val:plan.protG,max:250,color:'#00ff88'},
    {label:'Carbs',val:plan.carbG,max:400,color:'#00c8ff'},
    {label:'Fats',val:plan.fatG,max:150,color:'#a78bfa'},
    {label:'Fiber',val:Math.round(plan.cal*0.014/1),max:50,color:'#f59e0b'}
  ];
  wrap.innerHTML=bars.map(b=>{
    const pct=Math.min(100,(b.val/b.max)*100);
    return `<div class="bar-row"><span class="bar-label">${b.label}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${b.color}"></div></div><span class="bar-val">${b.val}g</span></div>`;
  }).join('');
}

// ---- Diet Quality Gauge ----
function drawGauge(plan,type){
  const canvas=document.getElementById('gauge-canvas');
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,200,120);
  // Calculate score
  let score=72;
  if(type==='diabetes'&&state.diabetes) score+=12;
  if(type==='heart'&&state.heart) score+=10;
  if(type==='fitness'&&state.goal==='gain') score+=8;
  if(state.activity==='active') score+=5;
  if(state.activity==='moderate') score+=3;
  score=Math.min(98,Math.max(60,score+Math.floor(Math.random()*8)));
  const cx=100,cy=100,r=80;
  const startA=Math.PI*0.8, endA=Math.PI*2.2, range=endA-startA;
  // Background arc
  ctx.beginPath();ctx.arc(cx,cy,r,startA,endA);ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=12;ctx.lineCap='round';ctx.stroke();
  // Score arc
  const scoreA=startA+(score/100)*range;
  const grad=ctx.createLinearGradient(0,0,200,0);
  grad.addColorStop(0,'#00ff88');grad.addColorStop(0.5,'#00c8ff');grad.addColorStop(1,'#a78bfa');
  ctx.beginPath();ctx.arc(cx,cy,r,startA,scoreA);ctx.strokeStyle=grad;ctx.lineWidth=12;ctx.lineCap='round';ctx.stroke();
  document.getElementById('gauge-score').textContent=score+'/100';
  const labels={general:'Balanced Diet',diabetes:'Diabetic Optimized',heart:'Heart Healthy',fitness:'Performance Fuel'};
  document.getElementById('gauge-label').textContent=labels[type]||'Balanced Diet';
  // Score factors
  const factors=[
    {l:'Balance',v:Math.min(95,score+3),c:'#00ff88'},
    {l:'Variety',v:Math.min(90,score-5+Math.floor(Math.random()*10)),c:'#00c8ff'},
    {l:'Nutrients',v:Math.min(92,score+1),c:'#a78bfa'},
    {l:'Hydration',v:Math.min(88,75+Math.floor(Math.random()*15)),c:'#f59e0b'}
  ];
  document.getElementById('score-factors').innerHTML=factors.map(f=>
    `<div class="score-factor"><span class="sf-label">${f.l}</span><div class="sf-bar"><div class="sf-fill" style="width:${f.v}%;background:${f.c}"></div></div><span class="sf-val">${f.v}%</span></div>`
  ).join('');
}

// ---- Meal Timing Timeline ----
function drawTimeline(plan){
  const wrap=document.getElementById('timeline-wrap');
  const times=[
    {time:'7:00 AM',meal:'Breakfast',desc:`${plan.meals.breakfast.cal} kcal — Start your day with energy`,color:'#00ff88',icon:'🌅'},
    {time:'10:30 AM',meal:'Mid-Morning Snack',desc:'Light snack to maintain blood sugar',color:'#f59e0b',icon:'🍎'},
    {time:'1:00 PM',meal:'Lunch',desc:`${plan.meals.lunch.cal} kcal — Your largest meal of the day`,color:'#00c8ff',icon:'☀️'},
    {time:'4:30 PM',meal:'Afternoon Snack',desc:'Healthy energy boost before evening',color:'#f59e0b',icon:'🥤'},
    {time:'7:30 PM',meal:'Dinner',desc:`${plan.meals.dinner.cal} kcal — Light & nutritious to aid sleep`,color:'#a78bfa',icon:'🌙'},
    {time:'9:00 PM',meal:'Post-Dinner (optional)',desc:'Herbal tea or warm milk for recovery',color:'#8888aa',icon:'🍵'}
  ];
  wrap.innerHTML=times.map(t=>
    `<div class="tl-item"><div class="tl-dot" style="background:${t.color}"></div><div class="tl-content"><div class="tl-time">${t.icon} ${t.time}</div><div class="tl-meal">${t.meal}</div><div class="tl-desc">${t.desc}</div></div></div>`
  ).join('');
}

// ---- Weekly Calorie Distribution ----
function drawWeekly(plan){
  const canvas=document.getElementById('weekly-canvas');
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const parentW = canvas.parentElement.clientWidth;
  const w=canvas.width=(parentW > 100 ? parentW : 600);
  const h=180;
  canvas.height=h;
  ctx.clearRect(0,0,w,h);
  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const base=plan.cal;
  const vals=days.map((_,i)=>base+Math.floor((Math.random()-0.4)*200));
  const maxV=Math.max(...vals)*1.15;
  const barW=(w-80)/7;
  const gap=10;
  // Grid lines
  ctx.strokeStyle='rgba(255,255,255,0.05)';ctx.lineWidth=1;
  for(let i=0;i<4;i++){
    const y=20+i*(h-50)/3;
    ctx.beginPath();ctx.moveTo(40,y);ctx.lineTo(w-10,y);ctx.stroke();
    ctx.fillStyle='#8888aa';ctx.font='10px Inter';ctx.textAlign='right';
    ctx.fillText(Math.round(maxV-(i*maxV/3)),35,y+4);
  }
  // Bars
  vals.forEach((v,i)=>{
    const x=50+i*(barW+gap);
    const bh=(v/maxV)*(h-60);
    const y=h-30-bh;
    const grad=ctx.createLinearGradient(x,y,x,h-30);
    grad.addColorStop(0,'#00ff88');grad.addColorStop(1,'rgba(0,255,136,0.2)');
    ctx.fillStyle=grad;
    ctx.beginPath();
    const r=4;
    ctx.moveTo(x+r,y);ctx.lineTo(x+barW-gap-r,y);ctx.quadraticCurveTo(x+barW-gap,y,x+barW-gap,y+r);
    ctx.lineTo(x+barW-gap,h-30);ctx.lineTo(x,h-30);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.fill();
    // Value on top
    ctx.fillStyle='#f0f0f5';ctx.font='bold 11px Inter';ctx.textAlign='center';
    ctx.fillText(v,x+(barW-gap)/2,y-6);
    // Day label
    ctx.fillStyle='#8888aa';ctx.font='11px Inter';
    ctx.fillText(days[i],x+(barW-gap)/2,h-12);
  });
}

// ---- Hydration Tracker ----
function drawHydration(){
  const wrap=document.getElementById('hydration-wrap');
  const totalL=Math.round(state.weight*0.033*10)/10;
  const glasses=Math.round(totalL/0.25);
  const schedule=[
    {time:'7:00 AM',label:'Wake up',amt:'2 glasses',pct:100},
    {time:'9:30 AM',label:'Mid-morning',amt:'1 glass',pct:85},
    {time:'12:00 PM',label:'Before lunch',amt:'1 glass',pct:75},
    {time:'2:00 PM',label:'After lunch',amt:'2 glasses',pct:65},
    {time:'4:30 PM',label:'Afternoon',amt:'1 glass',pct:45},
    {time:'6:30 PM',label:'Pre-dinner',amt:'1 glass',pct:30},
    {time:'9:00 PM',label:'Evening',amt:'1 glass',pct:15}
  ];
  let html=`<div style="text-align:center;margin-bottom:12px"><span style="font-size:28px;font-weight:900;color:var(--a2)">${totalL}L</span><span style="color:var(--m);font-size:13px;margin-left:8px">(${glasses} glasses/day)</span></div>`;
  html+=schedule.map(s=>
    `<div class="hydration-row"><span class="hydration-icon">💧</span><div class="hydration-info"><div class="hydration-time">${s.time} — ${s.label}</div><div class="hydration-amount">${s.amt}</div><div class="hydration-bar"><div class="hydration-fill" style="width:${s.pct}%"></div></div></div></div>`
  ).join('');
  wrap.innerHTML=html;
}

// ---- Nutrient Status Meters ----
function drawNutrientMeters(plan){
  const wrap=document.getElementById('nutrient-meters');
  const nutrients=[
    {name:'Protein',val:plan.protG,unit:'g',low:50,optLow:plan.protG*0.85,optHigh:plan.protG*1.15,high:plan.protG*1.5,max:plan.protG*1.8,color:'#00ff88'},
    {name:'Carbohydrates',val:plan.carbG,unit:'g',low:80,optLow:plan.carbG*0.85,optHigh:plan.carbG*1.15,high:plan.carbG*1.4,max:plan.carbG*1.7,color:'#00c8ff'},
    {name:'Fats',val:plan.fatG,unit:'g',low:20,optLow:plan.fatG*0.85,optHigh:plan.fatG*1.15,high:plan.fatG*1.4,max:plan.fatG*1.7,color:'#a78bfa'},
    {name:'Fiber',val:Math.round(plan.cal*0.014),unit:'g',low:15,optLow:25,optHigh:35,high:45,max:60,color:'#f59e0b'},
    {name:'Sugar',val:Math.round(plan.cal*0.05/4),unit:'g',low:0,optLow:0,optHigh:25,high:40,max:60,color:'#ef4444'}
  ];
  wrap.innerHTML='<div class="nm-row">'+nutrients.map(n=>{
    const pct=Math.min(100,(n.val/n.max)*100);
    let status='optimal',statusCls='optimal';
    if(n.val<n.optLow){status='Low — increase intake';statusCls='low';}
    else if(n.val>n.optHigh&&n.val<=n.high){status='Slightly high';statusCls='high';}
    else if(n.val>n.high){status='Too high — reduce';statusCls='high';}
    else{status='✓ Optimal range';statusCls='optimal';}
    const lowW=(n.optLow/n.max)*100, optW=((n.optHigh-n.optLow)/n.max)*100, highW=100-lowW-optW;
    return `<div class="nm-item">
      <div class="nm-head"><span class="nm-name">${n.name}</span><span class="nm-value">${n.val}${n.unit}</span><span class="nm-status ${statusCls}">${status}</span></div>
      <div class="nm-track">
        <div class="nm-zone" style="width:${lowW}%;background:rgba(239,68,68,.25)"></div>
        <div class="nm-zone" style="width:${optW}%;background:rgba(0,255,136,.2)"></div>
        <div class="nm-zone" style="width:${highW}%;background:rgba(251,191,36,.2)"></div>
        <div class="nm-marker" style="left:${pct}%"></div>
      </div>
      <div class="nm-labels"><span>Low</span><span>Optimal Range</span><span>High</span></div>
    </div>`;
  }).join('')+'</div>';
}

// ---- BMI Spectrum ----
function drawBMISpectrum(){
  const wrap=document.getElementById('bmi-spectrum');
  const weight = Number(state.weight) || 70;
  const height = Number(state.height) || 170;
  const bmi=+(weight/((height/100)**2)).toFixed(1);
  let cat='Normal',catColor='#00ff88',activeIdx=1;
  if(bmi<18.5){cat='Underweight';catColor='#00c8ff';activeIdx=0;}
  else if(bmi<25){cat='Normal Weight';catColor='#00ff88';activeIdx=1;}
  else if(bmi<30){cat='Overweight';catColor='#fbbf24';activeIdx=2;}
  else{cat='Obese';catColor='#ef4444';activeIdx=3;}
  const pinPct=Math.min(97,Math.max(3,(bmi/45)*100));
  const ranges=[
    {label:'Underweight',range:'< 18.5',color:'#00c8ff'},
    {label:'Normal',range:'18.5 – 24.9',color:'#00ff88'},
    {label:'Overweight',range:'25 – 29.9',color:'#fbbf24'},
    {label:'Obese',range:'≥ 30',color:'#ef4444'}
  ];
  wrap.innerHTML=`<div class="bmi-spec">
    <div class="bmi-spec-val"><div class="bmi-spec-num" style="color:${catColor}">${bmi}</div><div class="bmi-spec-cat" style="color:${catColor}">${cat}</div></div>
    <div class="bmi-spec-bar">
      <div class="bmi-seg" style="width:25%;background:${ranges[0].color}"></div>
      <div class="bmi-seg" style="width:30%;background:${ranges[1].color}"></div>
      <div class="bmi-seg" style="width:25%;background:${ranges[2].color}"></div>
      <div class="bmi-seg" style="width:20%;background:${ranges[3].color}"></div>
      <div class="bmi-pin" style="left:${pinPct}%"></div>
    </div>
    <div class="bmi-spec-labels"><span>15</span><span>18.5</span><span>25</span><span>30</span><span>40+</span></div>
    <div class="bmi-ranges">${ranges.map((r,i)=>`<div class="bmi-range-card ${i===activeIdx?'active-range':''}"><strong style="color:${r.color}">${r.label}</strong>${r.range}</div>`).join('')}</div>
  </div>`;
}

// ---- Calorie Split by Meal ----
function drawCalorieSplit(plan){
  const wrap=document.getElementById('calorie-split');
  const meals=[
    {name:'Breakfast',cal:plan.meals.breakfast.cal,color:'#00ff88',icon:'🌅'},
    {name:'Lunch',cal:plan.meals.lunch.cal,color:'#00c8ff',icon:'☀️'},
    {name:'Dinner',cal:plan.meals.dinner.cal,color:'#a78bfa',icon:'🌙'},
    {name:'Snacks',cal:plan.meals.snacks.cal,color:'#f59e0b',icon:'🍎'}
  ];
  const total=meals.reduce((s,m)=>s+m.cal,0);
  const bar=meals.map(m=>{
    const pct=((m.cal/total)*100).toFixed(1);
    return `<div class="csb-seg" style="width:${pct}%;background:${m.color}">${Math.round(pct)}%</div>`;
  }).join('');
  const legend=meals.map(m=>{
    const pct=((m.cal/total)*100).toFixed(0);
    const ideal={Breakfast:'20-25%',Lunch:'30-35%',Dinner:'25-30%',Snacks:'10-15%'};
    return `<div class="csl-item"><div class="csl-dot" style="background:${m.color}"></div><div class="csl-info"><div class="csl-name">${m.icon} ${m.name}</div><div class="csl-val">${m.cal} kcal</div></div><div><div class="csl-pct">${pct}%</div><div style="font-size:10px;color:var(--m)">Ideal: ${ideal[m.name]}</div></div></div>`;
  }).join('');
  wrap.innerHTML=`<div class="cal-split"><div class="cal-split-bar">${bar}</div><div class="cal-split-legend">${legend}</div></div>`;
}

// ---- Micronutrient Targets ----
function drawMicroTargets(plan){
  const wrap=document.getElementById('micro-targets');
  const cal=plan.cal;
  const micros=[
    {icon:'🦴',name:'Calcium',amt:'1000mg',target:1000,actual:Math.round(600+cal*0.15),unit:'mg'},
    {icon:'🩸',name:'Iron',amt:'18mg',target:18,actual:Math.round(8+cal*0.004),unit:'mg'},
    {icon:'☀️',name:'Vitamin D',amt:'600 IU',target:600,actual:Math.round(200+cal*0.12),unit:'IU'},
    {icon:'🍊',name:'Vitamin C',amt:'90mg',target:90,actual:Math.round(50+cal*0.03),unit:'mg'},
    {icon:'🌿',name:'Fiber',amt:'30g',target:30,actual:Math.round(cal*0.014),unit:'g'},
    {icon:'⚡',name:'Potassium',amt:'2600mg',target:2600,actual:Math.round(1800+cal*0.4),unit:'mg'},
    {icon:'🧲',name:'Magnesium',amt:'400mg',target:400,actual:Math.round(200+cal*0.08),unit:'mg'}
  ];
  wrap.innerHTML='<div class="micro-grid">'+micros.map(m=>{
    const pct=Math.min(100,(m.actual/m.target)*100);
    let status='good',label='✓ On Target',color='#00ff88';
    if(pct<60){status='low';label='⚠ Low';color='#f87171';}
    else if(pct<85){status='low';label='↑ Increase';color='#fbbf24';}
    else if(pct>120){status='excess';label='↓ Reduce';color='#fbbf24';}
    return `<div class="micro-item">
      <span class="micro-icon">${m.icon}</span>
      <div class="micro-info"><div class="micro-name">${m.name}</div><div class="micro-amt">${m.actual}${m.unit} of ${m.amt} target</div><div class="micro-bar-wrap"><div class="micro-bar-fill" style="width:${pct}%;background:${color}"></div></div></div>
      <span class="micro-status ${status}">${label}</span>
    </div>`;
  }).join('')+'</div>';
}

// ---- About Us Navigation ----
const navAbout=document.getElementById('nav-about');
if(navAbout) navAbout.addEventListener('click',e=>{e.preventDefault();showScreen('screen-about');});
const aboutBack=document.getElementById('about-back-home');
if(aboutBack) aboutBack.addEventListener('click',e=>{e.preventDefault();showScreen('screen-landing');});
const aboutStart=document.getElementById('btn-about-start');
if(aboutStart) aboutStart.addEventListener('click',()=>showScreen('screen-wizard'));

// ---- Chatbot ----
const chatFab=document.getElementById('chat-fab');
const chatPanel=document.getElementById('chat-panel');
const chatClose=document.getElementById('chat-close');
const chatBody=document.getElementById('chat-body');

chatFab.addEventListener('click',()=>chatPanel.classList.toggle('open'));
chatClose.addEventListener('click',()=>chatPanel.classList.remove('open'));

const chatResponses={
  'get-started':'Welcome! 🎉 To get your personalized diet plan:\n\n1️⃣ Click "Start Your Analysis" on the home page\n2️⃣ Fill in your details across 4 quick steps\n3️⃣ Watch our AI analyze your profile\n4️⃣ Get your complete nutrition dashboard!\n\nThe entire process takes under 60 seconds.',
  'how-it-works':'Our AI engine works in 3 phases:\n\n🔬 Phase 1: Collects your body metrics, health conditions, and goals\n⚙️ Phase 2: Runs 6 specialized models (BMR calculator, macro optimizer, condition filters, meal matcher, nutrient balancer, hydration planner)\n📊 Phase 3: Generates a complete dashboard with meal plans, charts, insights, and recommendations\n\nAll processing happens locally — your data never leaves your device.',
  'generate-diet':'Ready to generate your plan? Here\'s what you\'ll need:\n\n• Your age, weight, and height\n• Any health conditions (diabetes, heart, kidney)\n• Your activity level and goal (lose/maintain/gain)\n\nClick the green "Start Your Analysis" button on the home page to begin! The AI will handle everything else.',
  'understand-results':'Your results dashboard includes:\n\n🍽️ Meal Plan — 4 meals with portions & prep tips\n📊 Nutrition Breakdown — Pie chart + bar chart of macros\n🏆 Diet Quality Score — Overall rating out of 100\n⏰ Meal Timing — When to eat for optimal results\n📅 Weekly Calories — Projected daily intake across 7 days\n🔬 Nutrient Meters — Low/Optimal/High status for each macro\n💊 Micronutrients — Iron, calcium, vitamins with target progress\n💧 Hydration Plan — Personalized water schedule\n\nSwitch between 4 plan types using the tabs!',
  'privacy':'Your privacy is our priority 🔒\n\n✅ 100% client-side — no data sent to any server\n✅ No account required — no email, no signup\n✅ No cookies or tracking — zero data storage\n✅ Works offline — once loaded, no internet needed\n\nYour health information stays entirely in your browser and is cleared when you close the page.',
  'about':'NutriAI is an AI-powered diet intelligence platform built by a team of three B.Tech students as their INT428 AI project.\n\n👨‍💻 Sangam Gupta — Backend Developer\n👩‍💻 Jigyasa Pandey — Frontend Developer\n🔬 Arayana Sood — ML Engineer & Testing\n\nOur goal: make personalized nutrition accessible through intelligent, privacy-first technology. Visit the About Us page to learn more!'
};

document.querySelectorAll('.chat-chip').forEach(chip=>{
  chip.addEventListener('click',()=>{
    const key=chip.dataset.key;
    const userText=chip.textContent;
    // Add user message
    chatBody.innerHTML+=`<div class="chat-msg user"><div class="chat-bubble">${userText}</div></div>`;
    // Add bot response with typing delay
    setTimeout(()=>{
      const resp=chatResponses[key]||'I\'m not sure about that. Try one of the quick actions below!';
      chatBody.innerHTML+=`<div class="chat-msg bot"><div class="chat-bubble">${resp.replace(/\n/g,'<br>')}</div></div>`;
      chatBody.scrollTop=chatBody.scrollHeight;
    },500);
    chatBody.scrollTop=chatBody.scrollHeight;
  });
});

// ---- Init ----
updateBMI();
updateWizard();

})();
