let peopleList = [];
let activePersonIndex = null;

// =============== دالة حفظ البيانات في LocalStorage ===============
function saveToLocalStorage() {
    try {
        // حفظ كل شخص مع منتجاته
        const dataToSave = peopleList.map(person => {
            return {
                ...person,
                // تأكد من أن المنتجات تحتوي على معرفات فريدة إذا لم تكن موجودة
                products: person.products.map(product => ({
                    ...product,
                    id: product.id || Date.now() + Math.random()
                }))
            };
        });
        
        localStorage.setItem('peopleData', JSON.stringify(dataToSave));
        console.log('تم حفظ البيانات في LocalStorage');
    } catch (error) {
        console.error('خطأ في حفظ البيانات في LocalStorage:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ في الحفظ',
            text: 'حدث خطأ أثناء حفظ البيانات'
        });
    }
}

// =============== دالة تحميل البيانات من LocalStorage ===============
function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('peopleData');
        
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            
            // استعادة البيانات مع القيم الافتراضية
            peopleList = parsedData.map(person => ({
                id: person.id || Date.now() + Math.random(),
                name: person.name || '',
                phone: person.phone || '',
                date: person.date || new Date().toISOString().split('T')[0],
                products: person.products || [],
                total: person.total || 0,
                paid: person.paid || 0,
                note: person.note || '',
                paymentDate: person.paymentDate || '',
                notificationTime: person.notificationTime || '',
                reminderShown: person.reminderShown || false,
                showProductsDiv: false
            }));
            
            // إعادة حساب الإجماليات للمنتجات
            peopleList.forEach(person => {
                person.total = calculateTotalFromProducts(person.products);
            });
            
            console.log('تم تحميل البيانات من LocalStorage:', peopleList.length, 'شخص');
            
            displayPeople(peopleList);
            updateStats();
        } else {
            console.log('لا توجد بيانات محفوظة في LocalStorage');
        }
    } catch (error) {
        console.error('خطأ في تحميل البيانات من LocalStorage:', error);
        peopleList = [];
    }
}

// =============== دوال التحويل والتنسيق ===============
function calculateTotalFromProducts(products) {
    return products.reduce((sum, product) => {
        const quantity = product.quantity || 1;
        return sum + (product.price * quantity);
    }, 0);
}

function updateStats() {
    const totalPeople = peopleList.length;
    const totalAmount = peopleList.reduce((sum, person) => sum + person.total, 0);
    const totalRemain = peopleList.reduce((sum, person) => sum + (person.total - person.paid), 0);

    document.getElementById('totalPeople').textContent = totalPeople;
    document.getElementById('totalAmount').textContent = totalAmount + ' DH';
    document.getElementById('totalRemain').textContent = totalRemain + ' DH';
}

// =============== دوال إدارة الأشخاص ===============
function addPerson() {
    let name = document.getElementById("name").value.trim();
    let phone = document.getElementById("phone").value.trim();
    let date = document.getElementById("date").value;

    if (!name || !date) {
        Swal.fire({
            title: 'حقل مطلوب',
            text: 'يرجى ملء جميع الحقول المطلوبة (الاسم والتاريخ)',
            icon: 'warning',
            confirmButtonText: 'حسناً'
        });
        return;
    }

    const newPerson = {
        id: Date.now() + Math.random(), // معرف فريد
        name,
        phone,
        date,
        products: [],
        total: 0,
        paid: 0,
        note: '',
        paymentDate: '',
        notificationTime: '',
        reminderShown: false,
        showProductsDiv: false
    };

    peopleList.push(newPerson);
    
    // حفظ في LocalStorage
    saveToLocalStorage();

    document.getElementById("name").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("date").value = "";

    Swal.fire({
        icon: "success",
        title: "تمت الإضافة بنجاح",
        text: `تمت إضافة ${name} إلى القائمة`,
        timer: 1500,
        showConfirmButton: false
    });

    displayPeople(peopleList);
    updateStats();
}

function RemoveBtn(index) {
    Swal.fire({
        title: "هل أنت متأكد؟",
        text: "لن تتمكن من استعادة هذا الشخص بعد الحذف!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#f72585",
        cancelButtonColor: "#4361ee",
        confirmButtonText: "نعم، احذفه!",
        cancelButtonText: "إلغاء"
    }).then((result) => {
        if (result.isConfirmed) {
            const person = peopleList[index];
            
            peopleList.splice(index, 1);
            
            // حفظ التغييرات في LocalStorage
            saveToLocalStorage();
            
            displayPeople(peopleList);

            Swal.fire({
                title: "تم الحذف!",
                text: `تم حذف ${person.name} بنجاح.`,
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
}

// =============== دوال إدارة المنتجات ===============
function saveProduct() {
    let pname = document.getElementById("pname").value.trim();
    let price = Number(document.getElementById("pprice").value);
    let quantity = Number(document.getElementById("pquantity").value) || 1;
    let pdate = document.getElementById("pdate").value;

    if (!pname || !price || price <= 0) {
        Swal.fire({
            title: 'خطأ في الإدخال',
            text: 'يرجى إدخال اسم المنتج وسعر صحيح',
            icon: 'error',
            confirmButtonText: 'حسناً'
        });
        return;
    }

    if (quantity < 1) {
        Swal.fire({
            title: 'خطأ في الإدخال',
            text: 'يرجى إدخال كمية صحيحة (1 أو أكثر)',
            icon: 'error',
            confirmButtonText: 'حسناً'
        });
        return;
    }

    let person = peopleList[activePersonIndex];

    // إضافة المنتج الجديد
    const newProduct = {
        id: Date.now() + Math.random(),
        name: pname,
        price: price,
        quantity: quantity,
        date: pdate || new Date().toISOString().split('T')[0]
    };
    
    person.products.push(newProduct);
    
    // تحديث الإجمالي
    const productTotal = price * quantity;
    person.total += productTotal;
    
    // حفظ التغييرات في LocalStorage
    saveToLocalStorage();

    Swal.fire({
        icon: "success",
        title: "تمت الإضافة",
        text: `تمت إضافة ${quantity} × ${pname} بقيمة إجمالية ${productTotal} DH`,
        timer: 1500,
        showConfirmButton: false
    });

    closeProductForm();
    displayPeople(peopleList);
}

function removeProduct(personIndex, productIndex) {
    Swal.fire({
        title: "هل أنت متأكد؟",
        text: "لن تتمكن من استعادة هذا المنتج بعد الحذف!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#f72585",
        cancelButtonColor: "#4361ee",
        confirmButtonText: "نعم، احذفه!",
        cancelButtonText: "إلغاء"
    }).then((result) => {
        if (result.isConfirmed) {
            const person = peopleList[personIndex];
            const product = person.products[productIndex];
            
            // حساب قيمة المنتج وإزالتها من الإجمالي
            const productTotal = product.price * (product.quantity || 1);
            person.total -= productTotal;
            person.products.splice(productIndex, 1);
            
            // حفظ التغييرات في LocalStorage
            saveToLocalStorage();
            
            Swal.fire({
                title: "تم الحذف!",
                text: `تم حذف المنتج "${product.name}" بنجاح.`,
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });
            
            displayPeople(peopleList);
        }
    });
}

// =============== دوال الدفع والملاحظات ===============
function openPayInput(index) {
    Swal.fire({
        title: "إدخال مبلغ الدفع",
        input: "number",
        inputPlaceholder: "أدخل مبلغ الدفع",
        inputAttributes: {
            min: "0"
        },
        showCancelButton: true,
        confirmButtonText: "إضافة",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#4361ee",
        cancelButtonColor: "#6c757d"
    }).then(result => {
        if (result.isConfirmed) {
            let amount = Number(result.value);

            if (!amount || amount <= 0) {
                Swal.fire("خطأ", "أدخل مبلغ صحيح أكبر من الصفر!", "error");
                return;
            }

            const person = peopleList[index];
            
            // تحديث المبلغ المدفوع
            person.paid += amount;
            
            // حفظ التغييرات في LocalStorage
            saveToLocalStorage();

            Swal.fire({
                icon: "success",
                title: "تمت الإضافة",
                text: `تم إضافة مبلغ ${amount} DH للمدفوعات`,
                timer: 1200,
                showConfirmButton: false
            });

            displayPeople(peopleList);
        }
    });
}

function saveNote() {
    const person = peopleList[activePersonIndex];
    const noteText = document.getElementById("noteText").value.trim();
    const paymentDate = document.getElementById("paymentDate").value;
    const notificationTime = document.getElementById("notificationTime").value;

    person.note = noteText;
    person.paymentDate = paymentDate;
    person.notificationTime = notificationTime;
    person.reminderShown = false;
    
    // حفظ التغييرات في LocalStorage
    saveToLocalStorage();

    Swal.fire({
        icon: "success",
        title: "تم الحفظ",
        text: "تم حفظ الملاحظة وتاريخ الدفع بنجاح",
        timer: 1200,
        showConfirmButton: false
    });

    closeNoteForm();
    displayPeople(peopleList);
}

// =============== دوال العرض والبحث ===============
function displayPeople(list) {
    let results = document.getElementById("results");

    if (list.length === 0) {
        results.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>لا يوجد أشخاص تطابق البحث</p>
            </div>
        `;
        updateStats();
        return;
    }

    results.innerHTML = "";

    list.forEach((person, index) => {
        let remain = person.total - person.paid;
        let remainClass = remain > 0 ? "remain-value" : "success-color";

        let daysRemaining = '';
        if (person.paymentDate) {
            const today = new Date();
            const paymentDate = new Date(person.paymentDate);
            const diffTime = paymentDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 0) {
                daysRemaining = ` (متبقي ${diffDays} يوم)`;
            } else if (diffDays === 0) {
                daysRemaining = ' (اليوم)';
            } else {
                daysRemaining = ` (متأخر ${Math.abs(diffDays)} يوم)`;
            }
        }

        results.innerHTML += `
            <div class="card">
                <div class="card-header">
                    <div class="person-info">
                        <div class="person-name">${person.name}</div>
                        <div class="person-details">
                            <div class="person-date">
                                <i class="far fa-calendar-alt"></i> ${person.date}
                            </div>
                            ${person.phone ? `
                            <div class="person-phone">
                                <i class="fas fa-phone"></i> ${person.phone}
                            </div>
                            ` : ''}
                        </div>
                        ${person.paymentDate ? `
                        <div class="payment-date-reminder">
                            <i class="fas fa-bell"></i>
                            <div class="reminder-text">
                                موعد الدفع: <span class="reminder-date">${person.paymentDate}${daysRemaining}</span>
                                ${person.notificationTime ? ` - الساعة ${person.notificationTime}` : ''}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="person-actions">
                        <button class="note-btn ${person.note || person.paymentDate ? 'has-note' : ''}" onclick="openNoteForm(${index})" title="${person.note || person.paymentDate ? 'عرض/تعديل الملاحظة' : 'إضافة ملاحظة'}">
                            <i class="fas ${person.note || person.paymentDate ? 'fa-sticky-note' : 'fa-sticky-note'}"></i>
                        </button>
                        <span class="products-count"><i class="fas fa-box"></i> ${person.products.length}</span>
                    </div>
                </div>

                <div class="financial-info">
                    <div class="info-item">
                        <div class="info-label">عدد المنتجات</div>
                        <div class="info-value products-count">${person.products.length}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">الواجب دفعه</div>
                        <div class="info-value total-value">${person.total} DH</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">المدفوع</div>
                        <div class="info-value paid-value">${person.paid} DH</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">المتبقي</div>
                        <div class="info-value ${remainClass}">${remain} DH</div>
                    </div>
                </div>

                <div class="btn-group">
                    <button class="btn btn-success btn-sm" onclick="openPayInput(${index})">
                        <i class="fas fa-money-bill-wave"></i> دفع
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="openProductForm(${index})">
                        <i class="fas fa-plus"></i> منتج
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="toggleProductsDiv(${index})">
                        <i class="fas fa-list"></i> ${person.showProductsDiv ? "إخفاء المنتجات" : "عرض المنتجات"}
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="RemoveBtn(${index})">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>

                <div class="productsDiv" id="productsDiv-${index}" style="display:${person.showProductsDiv ? "block" : "none"};">
                     ${person.products.length > 0 ? `
                    <table>
                        <thead>
                            <tr>
                                <th>اسم المنتج</th>
                                <th>السعر</th>
                                <th>الكمية</th>
                                <th>الإجمالي</th>
                                <th>التاريخ</th>
                                <th class="actions-cell">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${person.products.map((p, pIndex) => {
                                const quantity = p.quantity || 1;
                                const totalPrice = p.price * quantity;
                                return `
                                <tr>
                                    <td>${p.name}</td>
                                    <td>${p.price} DH</td>
                                    <td class="product-quantity-cell">
                                        <span class="quantity-display">${quantity}</span>
                                    </td>
                                    <td class="product-total-price">${totalPrice} DH</td>
                                    <td class="product-date">
                                        <i class="far fa-calendar-alt"></i> ${p.date || 'لا يوجد تاريخ'}
                                    </td>
                                    <td>
                                        <button class="delete-product-btn" onclick="removeProduct(${index}, ${pIndex})" title="حذف المنتج">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                                `;
                            }).join("")}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colspan="6">الواجب دفعه</th>
                                <th>${person.total} DH</th>
                            </tr>
                        </tfoot>
                    </table>
                    ` : `<p class="empty-state"><i class="fas fa-box-open"></i> لا توجد منتجات مضافة</p>`}
                    <button class="hideBtn" onclick="toggleProductsDiv(${index})">
                        <i class="fas fa-eye-slash"></i> إخفاء
                    </button>
                </div>
            </div>
        `;
    });

    updateStats();
}

function searchPerson() {
    let text = document.getElementById("search").value.toLowerCase();
    let filtered = peopleList.filter(p =>
        p.name.toLowerCase().includes(text) ||
        (p.phone && p.phone.includes(text)) ||
        (p.note && p.note.toLowerCase().includes(text))
    );
    displayPeople(filtered);
}

// =============== دوال واجهة المستخدم ===============
function openProductForm(index) {
    activePersonIndex = index;
    document.getElementById("productPopup").style.display = "flex";
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('pdate').value = today;
    document.getElementById('pquantity').value = 1;
    
    document.body.style.overflow = "hidden";
}

function closeProductForm() {
    document.getElementById("productPopup").style.display = "none";
    document.body.style.overflow = "auto";
    document.getElementById("pname").value = "";
    document.getElementById("pprice").value = "";
    document.getElementById("pquantity").value = "1";
    document.getElementById("pdate").value = "";
}

function openNoteForm(index) {
    activePersonIndex = index;
    const person = peopleList[index];
    
    document.getElementById("noteText").value = person.note || '';
    document.getElementById("paymentDate").value = person.paymentDate || '';
    document.getElementById("notificationTime").value = person.notificationTime || '';
    
    document.getElementById("notePopup").style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeNoteForm() {
    document.getElementById("notePopup").style.display = "none";
    document.body.style.overflow = "auto";
}

function toggleProductsDiv(index) {
    peopleList[index].showProductsDiv = !peopleList[index].showProductsDiv;
    displayPeople(peopleList);
}

// =============== التنبيهات ===============
function checkReminders() {
    const now = new Date();
    peopleList.forEach((person, index) => {
        if (person.paymentDate && person.notificationTime) {
            const reminderDateTime = new Date(person.paymentDate + 'T' + person.notificationTime);
            
            if (reminderDateTime <= now && !person.reminderShown) {
                showReminderNotification(person, index);
                person.reminderShown = true;
                // حفظ تغيير حالة التنبيه
                saveToLocalStorage();
            }
        }
    });
}

function showReminderNotification(person, index) {
    Swal.fire({
        title: '⏰ تذكير بموعد الدفع',
        html: `موعد الدفع لـ <strong>${person.name}</strong> قد حان!<br>
              تاريخ الدفع: <strong>${person.paymentDate}</strong><br>
              المبلغ المتبقي: <strong>${person.total - person.paid} DH</strong><br>
              ${person.phone ? `رقم الهاتف: <strong>${person.phone}</strong><br>` : ''}
              `,
        icon: 'info',
        confirmButtonText: 'تمت المشاهدة',
        showCancelButton: true,
        cancelButtonText: 'تأجيل ليوم آخر',
        confirmButtonColor: '#4361ee',
        cancelButtonColor: '#6c757d'
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            peopleList[index].paymentDate = tomorrowStr;
            peopleList[index].reminderShown = false;
            
            // حفظ التغييرات في LocalStorage
            saveToLocalStorage();

            displayPeople(peopleList);

            Swal.fire({
                title: 'تم التأجيل',
                text: `تم تأجيل تذكير الدفع لـ ${person.name} ليوم ${tomorrowStr}`,
                icon: 'success',
                timer: 2000
            });
        }
    });
}

// =============== دوال إضافية للتحكم في البيانات ===============
function exportData() {
    try {
        const dataStr = JSON.stringify(peopleList, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `people-data-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        Swal.fire({
            icon: 'success',
            title: 'تم التصدير',
            text: 'تم تصدير البيانات بنجاح',
            timer: 1500
        });
    } catch (error) {
        console.error('خطأ في تصدير البيانات:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ أثناء تصدير البيانات'
        });
    }
}

function importData() {
    Swal.fire({
        title: 'استيراد البيانات',
        html: `
            <p>سيؤدي استيراد البيانات إلى استبدال جميع البيانات الحالية!</p>
            <input type="file" id="importFile" class="swal2-file" accept=".json">
        `,
        showCancelButton: true,
        confirmButtonText: 'استيراد',
        cancelButtonText: 'إلغاء',
        preConfirm: () => {
            const fileInput = document.getElementById('importFile');
            if (!fileInput.files.length) {
                Swal.showValidationMessage('يرجى اختيار ملف');
                return false;
            }
            
            const file = fileInput.files[0];
            const reader = new FileReader();
            
            return new Promise((resolve) => {
                reader.onload = (e) => {
                    try {
                        const importedData = JSON.parse(e.target.result);
                        resolve(importedData);
                    } catch (error) {
                        Swal.showValidationMessage('ملف غير صالح');
                        resolve(false);
                    }
                };
                reader.readAsText(file);
            });
        }
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            peopleList = result.value;
            saveToLocalStorage();
            displayPeople(peopleList);
            
            Swal.fire({
                icon: 'success',
                title: 'تم الاستيراد',
                text: `تم استيراد ${peopleList.length} شخص بنجاح`,
                timer: 1500
            });
        }
    });
}

function clearAllData() {
    Swal.fire({
        title: 'هل أنت متأكد؟',
        text: 'سيتم حذف جميع البيانات نهائياً ولن تتمكن من استعادتها!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f72585',
        cancelButtonColor: '#4361ee',
        confirmButtonText: 'نعم، احذف الكل!',
        cancelButtonText: 'إلغاء'
    }).then((result) => {
        if (result.isConfirmed) {
            peopleList = [];
            localStorage.removeItem('peopleData');
            displayPeople(peopleList);
            
            Swal.fire({
                title: 'تم الحذف!',
                text: 'تم حذف جميع البيانات بنجاح.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
}

// =============== تهيئة التطبيق ===============
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    
    // تحميل البيانات من LocalStorage
    loadFromLocalStorage();
    
    // بدء التحقق من التنبيهات كل دقيقة
    setInterval(checkReminders, 60000);
    
    // تحقق من التنبيهات عند التحميل
    setTimeout(checkReminders, 1000);
});