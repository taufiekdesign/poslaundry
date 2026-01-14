<script>
        // --- 1. CONFIGURATION ---
        const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxjq2xgX8r2QLxuo8acOS1b6uaKhcmRkOoW-VKzSY_wX-V89nRK9bG8-cuaGiF5zdyOaA/exec"; 

        // --- 2. GLOBAL STATE ---
        let products = []; 
        let cart = []; 
        let selectedProduct = null; 
        let customerDatabase = []; 
        let selectedRowData = null;
        let originalSheetHTML = ""; 

        // --- 3. INIT ---
        window.onload = () => {
            if(!APP_SCRIPT_URL) return alert("URL Script Belum Diset!");
            fetchServices(); 
            fetchCustomers();
            const sheetContent = document.getElementById('sheetContent');
            if(sheetContent) originalSheetHTML = sheetContent.innerHTML;
        };

        // --- 4. UI HELPER FUNCTIONS ---
        function showToast(msg, type='success') {
            const toast = document.getElementById('toast');
            document.getElementById('toastMsg').innerText = msg;
            toast.classList.remove('translate-y-[-100px]', 'opacity-0');
            setTimeout(() => toast.classList.add('translate-y-[-100px]', 'opacity-0'), 3000);
        }

        function toggleMetodeBayar() {
            document.getElementById('divMetodeBayar').classList.toggle('hidden', !document.getElementById('chkBayarAwal').checked);
        }

        // --- 5. DATA FETCHING (PRODUCTS) ---
        async function fetchServices() {
            try {
                const res = await fetch(`${APP_SCRIPT_URL}?action=products`);
                products = await res.json();
                renderServiceGrid();
            } catch(e) { 
                document.getElementById('serviceGrid').innerHTML = `<div class="col-span-2 text-center text-slate-400 py-4">Gagal memuat</div>`; 
            }
        }

        function renderServiceGrid() {
            const grid = document.getElementById('serviceGrid'); 
            grid.innerHTML = "";
            if(products.length===0) return grid.innerHTML = `<div class="col-span-2 text-center text-slate-400">Kosong</div>`;
            
            products.forEach(p => {
                const el = document.createElement('div');
                el.className = "card-service bg-white p-4 rounded-2xl cursor-pointer flex flex-col justify-between h-28 shadow-sm hover:shadow-md";
                el.innerHTML = `
                    <div class="text-blue-500 text-xl mb-2"><i class="fa-solid fa-shirt"></i></div>
                    <div>
                        <h3 class="font-bold text-slate-700 text-sm leading-tight mb-1">${p.name}</h3>
                        <p class="text-xs text-slate-400">Rp ${parseInt(p.price).toLocaleString('id-ID')}/kg</p>
                    </div>
                `;
                el.onclick = () => selectService(p, el);
                grid.appendChild(el);
            });
        }

        function selectService(product, element) {
            document.querySelectorAll('.card-service').forEach(el => el.classList.remove('selected', 'ring-2', 'ring-blue-500'));
            element.classList.add('selected', 'ring-2', 'ring-blue-500');
            selectedProduct = product;
            document.getElementById('selectedServiceName').innerText = product.name;
            document.getElementById('weightInputSection').classList.remove('hidden');
            document.getElementById('itemBerat').focus();
        }

        // --- 6. CART LOGIC ---
        function addToCart() {
            const berat = parseFloat(document.getElementById('itemBerat').value.replace(',', '.')) || 0;
            if (berat <= 0 || !selectedProduct) return showToast("Berat tidak valid!", "error");
            
            cart.push({ name: selectedProduct.name, price: selectedProduct.price, weight: berat, subtotal: berat * selectedProduct.price });
            document.getElementById('itemBerat').value = ""; 
            renderCart(); 
            window.scrollTo(0, document.body.scrollHeight);
        }

        function deleteItem(idx) { 
            cart.splice(idx, 1); 
            renderCart(); 
        }

        function renderCart() {
            const list = document.getElementById('cartList'); 
            const section = document.getElementById('cartSection');
            list.innerHTML = ""; 
            let total = 0;
            
            if (cart.length === 0) { 
                section.classList.add('hidden'); 
                document.getElementById('grandTotalDisplay').innerText = "Rp 0"; 
                return; 
            }
            
            section.classList.remove('hidden');
            
            cart.forEach((item, index) => {
                total += item.subtotal;
                list.innerHTML += `
                    <div class="p-4 flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">${item.weight}</div>
                            <div><h4 class="font-bold text-slate-800 text-sm">${item.name}</h4><p class="text-xs text-slate-400">Rp ${item.subtotal.toLocaleString('id-ID')}</p></div>
                        </div>
                        <button onclick="deleteItem(${index})" class="w-8 h-8 rounded-full text-slate-300 hover:text-red-500"><i class="fa-solid fa-trash-can"></i></button>
                    </div>`;
            });
            document.getElementById('grandTotalDisplay').innerText = "Rp " + total.toLocaleString('id-ID');
        }

        // --- 7. SUBMIT ORDER ---
        async function submitOrder() {
            if (cart.length === 0) return showToast("Keranjang kosong!");
            const nama = document.getElementById('nama').value; if(!nama) return showToast("Nama wajib diisi!");
            const btn = document.getElementById('btnSubmit'); const oriHTML = btn.innerHTML;
            btn.disabled = true; btn.innerHTML = `<div class="loader-dots"><span></span><span></span><span></span></div>`;
            
            const totalWeight = cart.reduce((s, i) => s + i.weight, 0);
            const totalPrice = cart.reduce((s, i) => s + i.subtotal, 0);
            const isLunas = document.getElementById('chkBayarAwal').checked;
            
            try {
                await fetch(APP_SCRIPT_URL, { 
                    method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ 
                        nama, hp: "62"+document.getElementById('hp').value.replace(/\D/g,'').replace(/^0/,'').replace(/^62/,''),
                        berat: totalWeight, harga: totalPrice, status: "Dikerjakan",
                        status_bayar: isLunas ? "Lunas" : "Belum Lunas",
                        metode_bayar: isLunas ? document.getElementById('selectMetodeBayar').value : "-"
                    }) 
                });
                showToast("Order disimpan!");
                setTimeout(() => { 
                    const wa = `*NOTA LAUNDRY*\n\nHalo Kak *${nama}*,\n\n${cart.map(i=>`• ${i.name} (${i.weight}kg)`).join('\n')}\n\n💰 Total: Rp ${totalPrice.toLocaleString('id-ID')}\n💳 Status: ${isLunas?"LUNAS":"BELUM LUNAS"}\n\nTerima kasih!`;
                    window.open(`https://wa.me/62${document.getElementById('hp').value.replace(/\D/g,'').replace(/^0/,'').replace(/^62/,'')}?text=${encodeURIComponent(wa)}`, '_blank');
                    location.reload(); 
                }, 1000);
            } catch(e) { showToast("Gagal simpan", "error"); btn.disabled = false; btn.innerHTML = oriHTML; }
        }

        // --- 8. HISTORY LOGIC ---
        function openHistory() {
            document.getElementById('historyModal').classList.remove('hidden');
            const content = document.getElementById('historyContent');
            fetch(APP_SCRIPT_URL).then(r=>r.json()).then(data => {
                if(data.length === 0) return content.innerHTML = `<div class="text-center text-slate-400 mt-10">Belum ada data</div>`;
                let html = '<div class="space-y-3 pb-20">';
                data.slice().reverse().forEach(row => {
                    const st = (row.status||"").toLowerCase();
                    const statusClass = st.includes('selesai') ? 'bg-green-100 text-green-700' : st.includes('diambil') ? 'bg-slate-100 text-slate-500' : 'bg-yellow-100 text-yellow-700';
                    const lunasClass = row.status_bayar === 'Lunas' ? 'text-green-600' : 'text-red-500 font-bold';
                    const rowData = JSON.stringify(row).replace(/"/g, '&quot;');

                    html += `
                        <div class="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-bold text-slate-800 text-base capitalize">${row.nama}</h4>
                                    <p class="text-xs text-slate-400 mt-0.5">${new Date(row.tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'short'})} • ${row.berat}kg</p>
                                </div>
                                <button onclick="openUpdateSheet(${rowData})" class="text-xs font-bold px-3 py-1.5 rounded-lg ${statusClass} flex items-center gap-1 active:scale-95 transition">
                                    ${row.status} <i class="fa-solid fa-pen-to-square ml-1"></i>
                                </button>
                            </div>
                            <div class="flex justify-between items-center text-sm border-t border-slate-50 pt-3">
                                <span class="font-bold text-slate-700">Rp ${parseInt(row.harga).toLocaleString('id-ID')}</span>
                                <span class="text-xs ${lunasClass}">${row.status_bayar || 'Belum Lunas'}</span>
                            </div>
                        </div>`;
                });
                content.innerHTML = html + '</div>';
            }).catch(()=> content.innerHTML = '<div class="text-center text-red-400">Gagal load</div>');
        }
        function closeHistory() { document.getElementById('historyModal').classList.add('hidden'); }

        // --- 9. UPDATE SHEET LOGIC ---
        function openUpdateSheet(row) {
            selectedRowData = row;
            if(originalSheetHTML) document.getElementById('sheetContent').innerHTML = originalSheetHTML;
            document.getElementById('updateCustomerName').innerText = row.nama;
            document.getElementById('updateSheet').classList.remove('hidden');
            toggleSettleView(false); 
        }
        function closeUpdateSheet() { document.getElementById('updateSheet').classList.add('hidden'); }
        
        function toggleSettleView(showPayment) {
            document.getElementById('statusOptions').classList.toggle('hidden', showPayment);
            document.getElementById('paymentSettle').classList.toggle('hidden', !showPayment);
            if(showPayment && selectedRowData) {
                document.getElementById('settleAmount').innerText = "Rp " + parseInt(selectedRowData.harga).toLocaleString('id-ID');
            }
        }

        function checkPaymentFirst() {
            if(selectedRowData.status_bayar !== "Lunas") toggleSettleView(true);
            else processUpdate("Diambil");
        }

        async function processUpdate(newStatus, isSettle = false) {
            if(!selectedRowData) return;
            const sheetContent = document.getElementById('sheetContent');
            sheetContent.innerHTML = `<div class="h-48 flex flex-col items-center justify-center text-slate-500"><div class="loader-dots mb-2"><span></span><span></span><span></span></div><p class="text-sm">Menyimpan...</p></div>`;

            let payload = { action: 'update', rowNumber: selectedRowData.rowNumber, status: newStatus };
            if(isSettle) {
                payload.status_bayar = "Lunas";
                payload.metode_bayar = "Tunai"; // Default tunai for simplicity in mobile view
            }

            try {
                await fetch(APP_SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
                
                const hp = "62" + selectedRowData.hp.toString().replace(/^0/,'').replace(/^62/,'');
                let wa = `ℹ️ Status Laundry *${selectedRowData.nama}*: ${newStatus}`;
                if(newStatus==='Selesai') wa = `✅ *LAUNDRY SELESAI*\n\nHalo Kak ${selectedRowData.nama}, laundry sudah selesai dan bisa diambil.\nTotal: Rp ${parseInt(selectedRowData.harga).toLocaleString('id-ID')}`;
                else if(newStatus==='Diambil') wa = `👋 *TERIMA KASIH*\n\nHalo Kak ${selectedRowData.nama}, laundry sudah diambil.${isSettle ? ' (LUNAS)' : ''}`;

                window.open(`https://wa.me/${hp}?text=${encodeURIComponent(wa)}`, '_blank');
                closeUpdateSheet();
                openHistory();
            } catch(e) {
                alert("Gagal update"); closeUpdateSheet();
            }
        }

        // --- 10. AUTOCOMPLETE ---
        async function fetchCustomers() {
            try {
                const res = await fetch(APP_SCRIPT_URL); const data = await res.json();
                const uniqueCust = new Map();
                data.forEach(row => { if (row.nama && row.hp) uniqueCust.set(row.nama.toLowerCase().trim(), { nama: row.nama, hp: row.hp }); });
                customerDatabase = Array.from(uniqueCust.values());
            } catch (e) {}
        }
        const namaInput = document.getElementById("nama");
        const listDiv = document.getElementById("autocomplete-list");
        namaInput.addEventListener("input", function() {
            const val = this.value; listDiv.innerHTML = ""; listDiv.classList.add("hidden");
            if (!val) return;
            let count = 0;
            customerDatabase.forEach(cust => {
                if (cust.nama.toLowerCase().includes(val.toLowerCase()) && count < 5) {
                    listDiv.classList.remove("hidden");
                    const item = document.createElement("div");
                    item.className = "px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center";
                    item.innerHTML = `<span class="font-medium text-slate-700">${cust.nama}</span><span class="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">${cust.hp}</span>`;
                    item.onclick = () => { namaInput.value = cust.nama; document.getElementById('hp').value = cust.hp.toString().replace(/^62/, '').replace(/^0/, ''); listDiv.classList.add("hidden"); };
                    listDiv.appendChild(item); count++;
                }
            });
        });
        document.addEventListener('click', (e) => { if (e.target !== namaInput) listDiv.classList.add("hidden"); });
        
        // --- 11. SECURITY ---
        document.addEventListener('contextmenu', event => event.preventDefault());
        document.onkeydown = function(e) { if(e.keyCode == 123) return false; }
    </script>
