import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Module from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
function load(path) {
  const file=fileURLToPath(new URL(path,import.meta.url));
  const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod=new Module(file); mod._compile(code,file); return mod.exports;
}
const {previewCheckout}=load('../src/lib/buyer/pricing.ts');
const {csvCell,pointReportCsv}=load('../src/lib/admin/report.ts');
const item=(sellerId,priceCents,quantity=1)=>({product:{sellerId,priceCents},quantity});
test('Bs 200 product reserves Bs 108 and leaves Bs 100; buyer service is not split in half',()=>{
  assert.deepEqual(previewCheckout([item('seller',20000)],800),{orderCount:1,merchandise:20000,fee:800,total:20800,deposit:10800,balance:10000});
});
test('multiple products from one seller pay one fee; separate sellers create separate fees',()=>{
  const same=previewCheckout([item('a',8000),item('a',12000)],800); assert.equal(same.fee,800); assert.equal(same.total,20800);
  const split=previewCheckout([item('a',8000),item('b',12000)],800); assert.equal(split.fee,1600); assert.equal(split.orderCount,2); assert.equal(split.deposit+split.balance,split.total);
});
test('rounding happens for each seller order, matching PostgreSQL cent precision',()=>{
  assert.deepEqual(previewCheckout([item('a',1),item('b',1)],800),{orderCount:2,merchandise:2,fee:1600,total:1602,deposit:1602,balance:0});
  assert.equal(previewCheckout([],800).fee,0);
});
test('CSV safely escapes malicious formulas, quotes, separators and newlines',()=>{
  for(const input of ['=1+1',' +SUM(A1:A2)','@cmd','-12','\t=1']) assert.ok(csvCell(input).startsWith('"\''));
  assert.equal(csvCell('Punto "A", La Paz'),'"Punto ""A"", La Paz"');
  assert.equal(csvCell('A\nB'),'"A\nB"');
});
test('export includes reporting period, test filter and exact currency precision',()=>{
  const csv=pointReportCsv([{name:'Aula',active:true,completedOrders:3,commissionCents:1200}],'2026-11-01','2026-11-30',true);
  assert.ok(csv.includes('"12.00"')); assert.ok(csv.includes('"2026-11-01","2026-11-30","true"'));
});
