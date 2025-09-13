   const br = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

    const salaryEl = document.getElementById('salary');
    const methodEl = document.getElementById('method');
    const calcBtn = document.getElementById('calcBtn');
    const resultBox = document.getElementById('resultBox');
    const summaryEl = document.getElementById('summary');
    const breakdownEl = document.getElementById('breakdown');
    const copyBtn = document.getElementById('copyBtn');
    const printBtn = document.getElementById('printBtn');
    const downloadCsv = document.getElementById('downloadCsv');
    const pagueOptions = document.getElementById('pagueOptions');
    const savePercentInput = document.getElementById('savePercent');

    function clearResults(){
      breakdownEl.innerHTML = '';
      summaryEl.textContent = '';
    }

    function createRow(name, percent, amount){
      const tr = document.createElement('tr');
      const tdName = document.createElement('td'); tdName.textContent = name;
      const tdPercent = document.createElement('td'); tdPercent.textContent = percent + '%';
      const tdAmount = document.createElement('td'); tdAmount.textContent = br.format(amount);
      tr.appendChild(tdName); tr.appendChild(tdPercent); tr.appendChild(tdAmount);
      return tr;
    }

    function calculate(){
      const salary = parseFloat(salaryEl.value) || 0;
      const method = methodEl.value;
      clearResults();
      if(salary <= 0){ alert('Informe um salário válido.'); return; }

      let rows = [];
      let title = '';

      if(method === '50-30-20'){
        title = 'Método 50/30/20 aplicado';
        const needs = roundToCents(salary * 0.50);
        const wants = roundToCents(salary * 0.30);
        const save = roundToCents(salary * 0.20);
        rows.push(['Necessidades (50%)',50,needs]);
        rows.push(['Desejos (30%)',30,wants]);
        rows.push(['Poupança / Dívidas (20%)',20,save]);
      } else if(method === 'detalhado'){
        title = 'Método Detalhado aplicado';
        // 35% moradia, 15% alimentação, 10% transporte, 10% saúde, 10% lazer, 10% poupança, 10% imprevistos
        const map = [ ['Moradia',35], ['Alimentação',15], ['Transporte',10], ['Saúde',10], ['Lazer',10], ['Poupança',10], ['Imprevistos',10] ];
        map.forEach(([name,p])=> rows.push([name,p, roundToCents(salary * (p/100))]));
      } else if(method === 'pague-se'){
        const savePercent = parseInt(savePercentInput.value,10) || 15;
        title = `Pague-se Primeiro — reservando ${savePercent}%`;
        const save = roundToCents(salary * (savePercent/100));
        const remainder = salary - save;
        // distribuir o restante: 70% essenciais, 30% demais
        const essentials = roundToCents(remainder * 0.70);
        const other = roundToCents(remainder * 0.30);
        rows.push(['Poupança (reservado)', savePercent, save]);
        rows.push(['Essenciais (70% do restante)', Math.round((essentials/salary)*100), essentials]);
        rows.push(['Demais (30% do restante)', Math.round((other/salary)*100), other]);
      } else if(method === 'dividas'){
        title = 'Plano para Saída de Dívidas';
        // 60% essenciais, 20% pagamento extra de dívidas, 10% lazer, 10% reserva
        const map = [ ['Essenciais',60], ['Pagamento extra de dívidas',20], ['Lazer',10], ['Reserva',10] ];
        map.forEach(([name,p])=> rows.push([name,p, roundToCents(salary * (p/100))]));
      }

      resultBox.style.display = 'block';
      summaryEl.textContent = title + ' — Salário: ' + br.format(salary);
      breakdownEl.innerHTML = '';
      const thead = document.createElement('thead');
      thead.innerHTML = '<tr><th>Categoria</th><th>%</th><th>Valor</th></tr>';
      breakdownEl.appendChild(thead);
      const tbody = document.createElement('tbody');
      rows.forEach(r=> tbody.appendChild(createRow(r[0], r[1], r[2])));
      breakdownEl.appendChild(tbody);

      window.lastCalc = {salary: salary, rows: rows, title: title};
    }

    function roundToCents(x){
      return Math.round((x + Number.EPSILON) * 100) / 100;
    }

    methodEl.addEventListener('change', ()=>{
      if(methodEl.value === 'pague-se') pagueOptions.style.display = 'block'; else pagueOptions.style.display = 'none';
    });

    calcBtn.addEventListener('click', calculate);

    copyBtn.addEventListener('click', ()=>{
      if(!window.lastCalc){ alert('Faça um cálculo antes de copiar.'); return; }
      const lines = [];
      lines.push(window.lastCalc.title + ' — Salário: ' + br.format(window.lastCalc.salary));
      window.lastCalc.rows.forEach(r=> lines.push(`${r[0]} — ${r[1]}% — ${br.format(r[2])}`));
      navigator.clipboard.writeText(lines.join('\n')).then(()=> alert('Resultado copiado para a área de transferência.'));
    });

    printBtn.addEventListener('click', ()=>{
      if(!window.lastCalc){ alert('Faça um cálculo antes de imprimir.'); return; }
      const w = window.open('', '_blank');
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Resumo de Orçamento</title></head><body><pre>${escapeHtml(window.lastCalc.title)}\nSalário: ${br.format(window.lastCalc.salary)}\n\n${window.lastCalc.rows.map(r=> r[0] + ' — ' + r[1] + '% — ' + br.format(r[2])).join('\n')}</pre></body></html>`;
      w.document.write(html);
      w.document.close();
      w.print();
    });

    downloadCsv.addEventListener('click', ()=>{
      if(!window.lastCalc){ alert('Faça um cálculo antes de baixar.'); return; }
      const rows = [['Categoria','Percentual','Valor (R$)']].concat(window.lastCalc.rows.map(r=> [r[0], String(r[1])+'%', Number(r[2]).toFixed(2)]));
      const csv = rows.map(r=> r.map(cell=> '"'+String(cell).replace(/"/g,'""')+'"').join(',')).join('\n');
      const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='orcamento.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });

    function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    calculate();