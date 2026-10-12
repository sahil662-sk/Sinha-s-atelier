export function numberToWordsIndian(num: number): string {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(num);
  if (n === 0) return 'Zero Rupees Only';

  function convertTwoDigits(val: number): string {
    if (val === 0) return '';
    if (val < 20) return a[val];
    return b[Math.floor(val / 10)] + ' ' + a[val % 10];
  }

  let str = '';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const remainder = n % 100;

  if (crore > 0) str += convertTwoDigits(crore) + 'Crore ';
  if (lakh > 0) str += convertTwoDigits(lakh) + 'Lakh ';
  if (thousand > 0) str += convertTwoDigits(thousand) + 'Thousand ';
  if (hundred > 0) str += a[hundred] + 'Hundred ';
  if (remainder > 0) str += convertTwoDigits(remainder);

  return 'Rupees ' + str.trim() + ' Only';
}