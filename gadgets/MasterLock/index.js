function exec() {
  try {
    /** @type string[] */
    const inputs = [...document.getElementsByClassName('SP')]
      .map((itemElement, idx) => {
        if (itemElement.value === '' || Number.isNaN(+itemElement.value))
          document.querySelector(`#Validate${idx}`).textContent = 'Number please';
        else if (+itemElement.value > 40 || +itemElement.value < 0)
          document.querySelector(`#Validate${idx}`).textContent = 'Between 0 and 40 please.';
        else
          document.querySelector(`#Validate${idx}`).textContent = '';

        return itemElement.value;
      });

    if (inputs.includes(''))
      throw new Error('Numbers only please');

    const wholes = inputs.filter(item => !item.includes('.'));

    /** @type Set<string> */
    const digitSet = new Set();
    let oddOne;
    for (const whole of wholes) {
      if (digitSet.size === 0)
        digitSet.add(whole.slice(-1));
      else if (!digitSet.has(whole.slice(-1)))
        oddOne = +whole;
    }
    if (oddOne === undefined)
      throw new Error('No odd one');

    let pos1 = oddOne % 4;
    let pos2 = (oddOne + 2) % 4;

    const group1 = [];
    const group2 = [];
    while (pos1 < 40 && pos2 < 40) {
      group1.push(pos1);
      if (Math.abs(pos2 - oddOne) > 2)
        group2.push(pos2);

      pos1 += 4;
      pos2 += 4;
    }

    /** @type [number, number, number][] */
    const combos = [];
    for (const el1 of group1) {
      for (const el2 of group2)
        combos.push([el1, el2, oddOne]);
    }

    document.getElementById('ListArea').innerHTML = '';
    const bg1 = 'rgb(0, 200, 0)';
    const bg2 = 'rgb(200, 0, 0)';
    for (const combo of combos) {
      const div = document.createElement('div');
      div.className = 'combo';
      div.innerHTML = combo.join(' ');
      div.addEventListener('click', () => {
        if (globalThis.getComputedStyle(div)["background-color"] === bg1)
          div.style.backgroundColor = bg2;
        else
          div.style.backgroundColor = bg1;
      });
      document.getElementById('ListArea').appendChild(div);
    }
  }
  catch (e) {
    console.error(e);
  }
}