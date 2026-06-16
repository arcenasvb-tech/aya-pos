(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,48299,e=>{"use strict";var t=e.i(43476),a=e.i(71645),s=e.i(11795),r=e.i(3641),i=e.i(6392),d=e.i(88040),l=e.i(60684),n=e.i(1928),o=e.i(37727),c=e.i(5766);let m=[{name:"All",slug:"all"},{name:"Espresso",slug:"espresso"},{name:"Non-Coffee",slug:"non-coffee"},{name:"Frappe",slug:"frappe"},{name:"Refreshers",slug:"refreshers"},{name:"Beverages",slug:"beverages"},{name:"Pizza",slug:"pizza"}];e.s(["default",0,function(){let[e,p]=(0,a.useState)([]),[x,u]=(0,a.useState)("all"),[f,h]=(0,a.useState)(!1),[b,g]=(0,a.useState)(!0),[v,y]=(0,a.useState)(!1),[w,j]=(0,a.useState)(!1),N=(0,s.createClient)(),_=(0,r.useCartStore)(e=>e.items),C=(0,r.useCartStore)(e=>e.addItem),$=(0,r.useCartStore)(e=>e.clearCart),S=(0,r.useCartStore)(e=>e.getSubtotal),k=(0,r.useCartStore)(e=>e.getItemCount);(0,a.useEffect)(()=>{y(!0),z()},[]);let z=async()=>{try{let{data:e,error:t}=await N.from("products").select(`
          *,
          category:categories(name, slug),
          variants:product_variants(*),
          addons:product_addons(*)
        `).eq("is_active",!0).eq("is_available",!0).order("sort_order");if(t)throw t;let a=(e||[]).map(e=>({...e,variants:(e.variants||[]).filter(e=>!1!==e.is_active),addons:(e.addons||[]).filter(e=>!1!==e.is_active)}));p(a)}catch(e){console.error("Error fetching products:",e)}finally{g(!1)}},A=async e=>{try{let{data:{user:a}}=await N.auth.getUser(),{data:s,error:r}=await N.from("orders").insert({staff_id:a?.id,processed_by:e.processedBy,customer_name:e.customerName||null,payment_method:e.paymentMethod,subtotal:S(),total:S(),status:"completed"}).select("*, processed_by_profile:processed_by(full_name)").single();if(r)throw r;let i=_.map(e=>({order_id:s.id,product_id:e.productId,variant_id:e.variantId||null,quantity:e.quantity,unit_price:e.price,total_price:e.price*e.quantity,notes:e.notes||null})),{data:d,error:l}=await N.from("order_items").insert(i).select();if(l)throw l;if(d){let e=[];d.forEach((t,a)=>{let s=_[a];s?.addons?.length>0&&s.addons.forEach(a=>{e.push({order_item_id:t.id,addon_id:a.id,name:a.name,price:a.price})})}),e.length>0&&await N.from("order_item_addons").insert(e)}if(e.printReceipt){var t;let e,a,r;t={...s,processed_by_name:s.processed_by_profile?.full_name||"Staff"},e=new Date().toLocaleString("en-PH",{timeZone:"Asia/Manila"}),a=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${t.order_number||"N/A"}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            width: 80mm; 
            margin: 0 auto; 
            padding: 10px;
          }
          .header { text-align: center; margin-bottom: 12px; }
          .header h2 { font-size: 16px; margin-bottom: 2px; }
          .header p { font-size: 10px; color: #666; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .item { display: flex; justify-content: space-between; margin: 4px 0; font-size: 11px; }
          .item-name { flex: 1; }
          .addon { font-size: 10px; padding-left: 12px; color: #666; }
          .total { font-weight: bold; font-size: 14px; margin-top: 8px; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; color: #666; }
          @media print { body { width: 80mm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>AYA Studios</h2>
          <p>coffee & prints</p>
          <p>Order #${t.order_number||"N/A"}</p>
          <p>${e}</p>
        </div>
        <div class="divider"></div>
        ${_.map(e=>`
          <div class="item">
            <span class="item-name">${e.quantity}x ${e.productName}${e.variantName?` (${e.variantName})`:""}</span>
            <span>₱${(e.price*e.quantity).toFixed(2)}</span>
          </div>
          ${e.addons?.map(e=>`
            <div class="addon">+ ${e.name} (₱${e.price.toFixed(2)})</div>
          `).join("")||""}
        `).join("")}
        <div class="divider"></div>
        <div class="item total">
          <span>TOTAL</span>
          <span>₱${t.total.toFixed(2)}</span>
        </div>
        <div class="divider"></div>
        <div class="footer">
          <p>Payment: ${t.payment_method?.toUpperCase()||"N/A"}</p>
          <p>Processed by: ${t.processed_by_name||"N/A"}</p>
          <p style="margin-top:8px;">Thank you! ☕</p>
        </div>
        <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }</script>
      </body>
      </html>
    `,(r=window.open("","_blank","width=300,height=500"))&&(r.document.write(a),r.document.close())}c.default.success("Order completed!"),$(),h(!1),j(!1)}catch(e){c.default.error("Failed: "+e.message)}},T=v?k():0,P=v?S():0;return(0,t.jsxs)("div",{className:"flex flex-col md:flex-row gap-3 md:gap-4 h-[calc(100dvh-8rem)]",children:[(0,t.jsxs)("div",{className:"flex-1 flex flex-col min-w-0",children:[(0,t.jsx)("div",{className:"flex gap-1.5 mb-3 overflow-x-auto pb-1 flex-shrink-0 -mx-1 px-1",children:m.map(e=>(0,t.jsx)("button",{onClick:()=>u(e.slug),className:`px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${x===e.slug?"bg-brand-primary text-white shadow-sm":"bg-white text-brand-text-secondary border border-brand-border active:bg-brand-background"}`,children:e.name},e.slug))}),(0,t.jsx)("div",{className:"flex-1 overflow-y-auto pb-20 md:pb-0",children:b?(0,t.jsx)("div",{className:"flex items-center justify-center h-32",children:(0,t.jsx)("div",{className:"w-8 h-8 border-3 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"})}):(0,t.jsx)(i.default,{products:e,onAddToCart:(e,t,a)=>{C({productId:e.id,productName:e.name,variantId:t.id,variantName:t.name,price:t.price,quantity:1,addons:a||[]}),c.default.success(`${e.name} added`)},selectedCategory:"all"===x?null:x})})]}),(0,t.jsx)("div",{className:"hidden md:flex md:w-72 flex-shrink-0",children:(0,t.jsxs)("div",{className:"card flex-1 flex flex-col w-full !p-4",children:[(0,t.jsxs)("div",{className:"flex items-center justify-between mb-3",children:[(0,t.jsx)("h3",{className:"font-semibold text-brand-text text-sm",children:"Order"}),T>0&&(0,t.jsx)("span",{className:"badge bg-brand-primary/10 text-brand-primary text-xs",children:T})]}),(0,t.jsx)("div",{className:"flex-1 overflow-y-auto -mx-2 px-2",children:(0,t.jsx)(d.default,{})}),_.length>0&&(0,t.jsxs)("div",{className:"border-t border-brand-border pt-3 mt-3",children:[(0,t.jsxs)("div",{className:"flex justify-between mb-2",children:[(0,t.jsx)("span",{className:"text-sm text-brand-text-secondary",children:"Total"}),(0,t.jsxs)("span",{className:"text-lg font-bold",children:["₱",P.toFixed(2)]})]}),(0,t.jsx)("button",{onClick:()=>h(!0),className:"btn-primary w-full py-2.5 text-sm",children:"Checkout"}),(0,t.jsx)("button",{onClick:$,className:"btn-ghost w-full text-red-500 text-xs mt-1 py-1",children:"Clear"})]})]})}),(0,t.jsx)("div",{className:"md:hidden fixed bottom-16 left-0 right-0 px-3 z-30",children:(0,t.jsxs)("button",{onClick:()=>j(!0),className:"w-full bg-brand-text text-white py-3 px-4 rounded-2xl flex items-center justify-between shadow-lg active:scale-[0.98] transition-transform",children:[(0,t.jsxs)("span",{className:"flex items-center gap-2 font-medium text-sm",children:[(0,t.jsx)(n.ShoppingCart,{className:"w-5 h-5"}),T>0?`${T} items`:"Cart"]}),T>0&&(0,t.jsxs)("span",{className:"font-bold",children:["₱",P.toFixed(2)]})]})}),w&&(0,t.jsxs)("div",{className:"fixed inset-0 z-50 md:hidden",children:[(0,t.jsx)("div",{className:"absolute inset-0 bg-black/50",onClick:()=>j(!1)}),(0,t.jsxs)("div",{className:"absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[75vh] flex flex-col animate-slide-up",children:[(0,t.jsxs)("div",{className:"flex items-center justify-between p-4 border-b",children:[(0,t.jsxs)("h3",{className:"font-semibold text-lg",children:["Order (",T," items)"]}),(0,t.jsx)("button",{onClick:()=>j(!1),className:"p-2 hover:bg-brand-background rounded-xl",children:(0,t.jsx)(o.X,{className:"w-5 h-5"})})]}),(0,t.jsx)("div",{className:"flex-1 overflow-y-auto p-4",children:(0,t.jsx)(d.default,{})}),_.length>0&&(0,t.jsxs)("div",{className:"border-t p-4 space-y-2",children:[(0,t.jsxs)("div",{className:"flex justify-between font-bold text-lg",children:[(0,t.jsx)("span",{children:"Total"}),(0,t.jsxs)("span",{children:["₱",P.toFixed(2)]})]}),(0,t.jsx)("button",{onClick:()=>{j(!1),h(!0)},className:"btn-primary w-full py-3.5 text-base",children:"Proceed to Payment"})]})]})]}),f&&(0,t.jsx)(l.default,{onClose:()=>h(!1),onComplete:A,total:P})]})}])}]);