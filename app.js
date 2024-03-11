const monthNames = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"]

const formatter = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }) 

createDb = ()=> {
    const dbFile = indexedDB.open('yiffDb',1)

    dbFile.onupgradeneeded = (event) => {

        const db = event.target.result

        const fileStore = db.createObjectStore('files',{keyPath:'id',autoIncrement:true})

        const amountStore = db.createObjectStore('amounts',{keyPath:'id',autoIncrement:true})
        amountStore.createIndex('fileId','fileId',{unique:false})
        

    }
}

createDb()


createFile = ()=> {
    const dbFiles = indexedDB.open('yiffDb',1)

    dbFiles.onsuccess = (event) => {

            const db = event.target.result

            const fileStore = db.transaction('files','readwrite').objectStore('files')

            fileStore.put({     name: 'Yeni Dosya',                                
                                ihaleYear:new Date().getFullYear(),
                                ihaleMonth:new Date().getMonth() + 1,
                                a:0.0,
                                b1:0.0,
                                b2:0.0,
                                b3:0.0,
                                b4:0.0,
                                b5:1.0,
                                c:0.0,
                                B:0.90
                            })

            loadFiles()

    }
}

saveToIndexedDb = (id)=> {


                const dbFile = indexedDB.open('yiffDb',1)

                dbFile.onsuccess = (event) => {                       
                    
                            const db = event.target.result
                    
                            const fileStore = db.transaction('files','readwrite').objectStore('files') 

                            fileStore.get(id).onsuccess = (event) => {

                                const file = event.target.result

                                //console.log(file)

                                file.name = document.querySelector('#filename').value,
                                file.ihaleYear = parseInt(document.querySelector('#ihaleYear').value),
                                file.ihaleMonth = parseInt(document.querySelector('#ihaleMonth').value),
                                file.a = parseFloat(document.querySelector('#tbA').value),
                                file.b1 = parseFloat(document.querySelector('#tbB1').value),
                                file.b2 = parseFloat(document.querySelector('#tbB2').value),
                                file.b3 = parseFloat(document.querySelector('#tbB3').value),
                                file.b4 = parseFloat(document.querySelector('#tbB4').value),
                                file.b5 = parseFloat(document.querySelector('#tbB5').value),
                                file.c = parseFloat(document.querySelector('#tbC').value)
                                file.B = parseFloat(document.querySelector('#tbB').value)
                                fileStore.put(file) 

                            }

                            

                            const rows = getAllowanceRows()

                            const amounts = []
                        
                            rows.map(row => {
                                                const year = parseInt(row.getAttribute('year'))
                                                const month = parseInt(row.getAttribute('month'))
                                                const allowance = parseFloat(row.querySelectorAll('td')[1].querySelector('input').value.split('.').join('').replace(',','.'))
                                                const spending = parseFloat(row.querySelectorAll('td')[2].querySelector('input').value.split('.').join('').replace(',','.'))
                                                const B = parseFloat(row.querySelectorAll('td')[3].querySelector('input').value.split('.').join('').replace(',','.'))
                                                amounts.push({fileId:id,year:year,month:month,allowance:allowance,spending:spending,B:B})
                                             })
                            //console.log(amounts)
                            
                            const amountStore = db.transaction('amounts','readwrite').objectStore('amounts') 
                            const indexFile = amountStore.index("fileId")

                            let currentAmounts = []
                            indexFile.getAll(id).onsuccess = (event) => {

                                currentAmounts.push(...event.target.result)

                                
                                //console.log('mevcut',currentAmounts)
                                //console.log('yeni',amounts)

                                const deleteAmounts = currentAmounts.filter(ca => amounts.find(a => a.year == ca.year && a.month == ca.month) == null )

                                //console.log('silinecekler',deleteAmounts)

                                deleteAmounts.map(da => amountStore.delete(da.id))

                                amounts.map(amount => {

                                    let findAmount = currentAmounts.find(ca => ca.year == amount.year && ca.month == amount.month)

                                    if (findAmount == null){
                                        amountStore.put(amount)                                       
                                        
                                    } else {
                                      
                                                amountStore.get(parseInt(findAmount.id)).onsuccess = (event) => {                                                                                
                                                    const updateAmount = event.target.result
                                                    updateAmount.allowance = amount.allowance
                                                    updateAmount.spending = amount.spending
                                                    updateAmount.B = amount.B
                                                    amountStore.put(updateAmount)
                                                }

                                            }                                        
                                })     


                            }

                            

                                                             
            
            
                     }   
            

 }


loadFiles = ()=>{

    const dbFile = indexedDB.open('yiffDb',1)

    dbFile.onsuccess = (event) => {

        const db = event.target.result

        const fileStore = db.transaction('files','readonly').objectStore('files')

        fileStore.getAll().onsuccess = (event) => {

            const files = event.target.result

            const tbody = document.querySelector('#allFiles').querySelector('table').querySelector('tbody')
            let innerHtml = ''
            let rowIndex = 0
            Array.from(files).map(file => {

                innerHtml += `<tr class="row m-0">
                                    <td class="col-8">${file.name} <span class="confirm-span d-none"> Dosyası silinsin mi?</span></td>
                                    <td class="col-4 text-end">
                                            <button class="btn btn-primary btn-sm  d-inline open-file" onclick="openFile(${file.id})">Aç</button>
                                            <button class="btn btn-danger btn-sm  d-inline delete-file" onclick="confirmDeleteFile(${rowIndex})">Sil</button>  

                                            <button class="btn btn-danger  btn-sm d-none delete-yes" onclick="deleteFile(${file.id})">Evet</button>
                                            <button class="btn btn-success btn-sm d-none delete-no" onclick="NoConfirmDeleteFile(${rowIndex})">Hayır</button>                                 
                                    </td>
                                    
                              </tr> `

                rowIndex++
            })

            tbody.innerHTML = innerHtml
            
        }
    }


}

openFile = (id) => {

   showOrHideMenuButtons(2)

   const dbFile = indexedDB.open('yiffDb',1)

   dbFile.onsuccess = (event) => {

        const db = event.target.result

        const fileStore = db.transaction('files','readonly').objectStore('files')

        fileStore.get(id).onsuccess = (event) => {

            const allFiles = document.querySelector('#allFiles').style.display = 'none'

            const selectedFile = document.querySelector('#selectedFile').style.display = 'block'                     

            const file = event.target.result

            document.querySelector('#calcButton').setAttribute('file',JSON.stringify(file))   
            
            const filename = document.querySelector('#filename')
            const ihaleYear = document.querySelector('#ihaleYear')
            const ihaleMonth = document.querySelector('#ihaleMonth')
            const tbA = document.querySelector('#tbA')
            const tbB1 = document.querySelector('#tbB1')
            const tbB2 = document.querySelector('#tbB2')
            const tbB3 = document.querySelector('#tbB3')
            const tbB4 = document.querySelector('#tbB4')
            const tbB5 = document.querySelector('#tbB5')
            const tbC = document.querySelector('#tbC')
            const tbB = document.querySelector('#tbB')

            filename.value = file.name
            ihaleYear.value = file.ihaleYear
            ihaleMonth.value = file.ihaleMonth        
            tbA.value = file.a.toFixed(4)
            tbB1.value = file.b1.toFixed(4)
            tbB2.value = file.b2.toFixed(4)
            tbB3.value = file.b3.toFixed(4)
            tbB4.value = file.b4.toFixed(4)
            tbB5.value = file.b5.toFixed(4)
            tbC.value = file.c.toFixed(4)
            tbB.value = file.B.toFixed(2)


            const amountStore = db.transaction('amounts','readonly').objectStore('amounts')

            const indexFile = amountStore.index('fileId')

            indexFile.getAll(id).onsuccess = (event) => {    
                

                            //console.log(event.target.result)

                            const formatter = new Intl.NumberFormat('tr-TR', {
                                style: 'decimal',
                                minimumFractionDigits: 2,
                            })  
                        
                            let html = ''
                            Array.from(event.target.result).map(a => {
                        
                                html += 
                                `<tr class="row m-0" year="${a.year}" month="${a.month}">
                                        <td class="col-4">${a.year} &nbsp;&nbsp ${monthNames[a.month - 1]}</td>

                                        <td class="col-8" style="display:block" type="allowance">
                                                <input type="text" class="amount w-100 text-end" onfocus="amountOnFocus(this)" onblur="amountOnBlur(this)" value="${formatter.format(a.allowance)}" placeholder="${a.year} ${monthNames[a.month - 1]} Ödeneği">
                                        </td>
                        
                                        <td class="col-8" style="display:none" type="spending">
                                                <input type="text" class="amount w-100 text-end" onfocus="amountOnFocus(this)" onblur="amountOnBlur(this)" value="${formatter.format(a.spending)}" placeholder="${a.year} ${monthNames[a.month - 1]} Hakedişi">
                                        </td>

                                        <td class="col-8" style="display:none" type="B">
                                                <input type="text" class="amount w-100 text-end" onfocus="amountOnFocus(this)" onblur="amountOnBlur(this)" value="${formatter.format(a.B)}" placeholder="${a.year} ${monthNames[a.month - 1]} için B Katsayısı">
                                        </td>
                                </tr>`        
                            })
                            
                            const tbody = document.querySelector('#allowances')
                            tbody.innerHTML = html
        }

        }
   }
}

hideConfirmDeleteFiles = ()=> {
    const tbody = document.querySelector('#allFiles').querySelector('table').querySelector('tbody')
    const rows = tbody.querySelectorAll('tr')
    Array.from(rows).map(row => {

        Array.from(row.querySelectorAll('td')).map(td => {
            td.style.backgroundColor = 'white'
            td.style.color = 'black'
        })
        const span = row.querySelectorAll('td')[0].querySelector('span')
        const yesButton = row.querySelectorAll('td')[1].querySelector('.delete-yes')
        const noButton = row.querySelectorAll('td')[1].querySelector('.delete-no')
        const openButton = row.querySelectorAll('td')[1].querySelector('.open-file')
        const deleteButton = row.querySelectorAll('td')[1].querySelector('.delete-file')
    
        span.classList.replace('d-inline','d-none')
        yesButton.classList.replace('d-inline','d-none')
        noButton.classList.replace('d-inline','d-none')
        openButton.classList.replace('d-none','d-inline')
        deleteButton.classList.replace('d-none','d-inline')


    })
    
}

confirmDeleteFile = (rowIndex)=> {

    hideConfirmDeleteFiles()
    
    const tbody = document.querySelector('#allFiles').querySelector('table').querySelector('tbody')
    const row = tbody.querySelectorAll('tr')[rowIndex]
    Array.from(row.querySelectorAll('td')).map(td => {
        td.style.backgroundColor = 'yellow'
        td.style.color = 'red'
    })
    const span = row.querySelectorAll('td')[0].querySelector('span')
    const yesButton = row.querySelectorAll('td')[1].querySelector('.delete-yes')
    const noButton = row.querySelectorAll('td')[1].querySelector('.delete-no')
    const openButton = row.querySelectorAll('td')[1].querySelector('.open-file')
    const deleteButton = row.querySelectorAll('td')[1].querySelector('.delete-file')

    span.classList.replace('d-none','d-inline')
    yesButton.classList.replace('d-none','d-inline')
    noButton.classList.replace('d-none','d-inline')
    openButton.classList.replace('d-inline','d-none')
    deleteButton.classList.replace('d-inline','d-none')
  
    
}

NoConfirmDeleteFile = (rowIndex)=> {
    const tbody = document.querySelector('#allFiles').querySelector('table').querySelector('tbody')
    const row = tbody.querySelectorAll('tr')[rowIndex]
    Array.from(row.querySelectorAll('td')).map(td => {
        td.style.backgroundColor = 'white'
        td.style.color = 'black'
    })
    const span = row.querySelectorAll('td')[0].querySelector('span')
    const yesButton = row.querySelectorAll('td')[1].querySelector('.delete-yes')
    const noButton = row.querySelectorAll('td')[1].querySelector('.delete-no')
    const openButton = row.querySelectorAll('td')[1].querySelector('.open-file')
    const deleteButton = row.querySelectorAll('td')[1].querySelector('.delete-file')

    span.classList.replace('d-inline','d-none')
    yesButton.classList.replace('d-inline','d-none')
    noButton.classList.replace('d-inline','d-none')
    openButton.classList.replace('d-none','d-inline')
    deleteButton.classList.replace('d-none','d-inline')

}

deleteFile = (id) => {

        const dbFile = indexedDB.open('yiffDb',1)

        dbFile.onsuccess = (event) => {

            const db = event.target.result

            const fileStore = db.transaction('files','readwrite').objectStore('files')                     

            fileStore.get(id).onsuccess = (event) => {  
                
                    const amountStore = db.transaction('amounts','readwrite').objectStore('amounts')

                    const indexFile = amountStore.index('fileId')

                    indexFile.getAll(id).onsuccess = (event) => {

                    const amounts = event.target.result

                    //console.log(amounts)

                    amounts.map(a => amountStore.delete(a.id))                                         

                }               

          
            }

            fileStore.delete(id)

            loadFiles()


        }


}

let amountType = 'allowance'

createAllowances = (startYear,startMonth,endYear,endMonth) => {

    let dates = []

    const monthDiff = 12 * endYear + endMonth - 12 * startYear - startMonth

    let startDate = new Date (startYear,startMonth,1)

    let dateYear = startDate.getFullYear()

    let dateMonth = startDate.getMonth()

    for (let month = 0; month <= monthDiff ; month++ )
    {  

        dates.push({year:dateYear,month:dateMonth})
        
        //console.log(dateYear,dateMonth)

       if (dateMonth % 12 == 0)
       {
          dateYear += 1
          dateMonth = 0
       }

        dateMonth += 1        

    }



    const allowances = document.querySelector('#allowances')
    let html = ''
    
    dates.map(date => {

        html += `<tr class="row m-0" year="${date.year}" month="${date.month}">

                    <td class="col-4">${date.year} &nbsp;&nbsp ${monthNames[date.month - 1]}</td>

                    <td class="col-8" style="display:${amountType == 'allowance' ? 'block' : 'none'}" type="allowance">
                            <input type="text" class="w-100 text-end" onfocus="amountOnFocus(this)" onblur="amountOnBlur(this)" value="0,00" placeholder="${date.year}  ${monthNames[date.month - 1]} Ödeneği">
                    </td>

                    <td class="col-8" style="display:${amountType == 'spending' ? 'block' : 'none'}" type="spending">
                            <input type="text" class="w-100 text-end" onfocus="amountOnFocus(this)" onblur="amountOnBlur(this)" value="0,00" placeholder="${date.year}  ${monthNames[date.month - 1]} Hakedişi">
                    </td>

                    <td class="col-8" style="display:${amountType == 'B' ? 'block' : 'none'}" type="B">
                            <input type="text" class="w-100 text-end" onfocus="amountOnFocus(this)" onblur="amountOnBlur(this)" value="0,90" min="0.90" max="2" step="0.05" placeholder="${date.year}  ${monthNames[date.month - 1]} için B katsayısı">
                    </td>

                </tr> `
        //console.log(date)

    });

    allowances.innerHTML += html

}



getTuik = async() =>{

    const response = await fetch('https://raw.githubusercontent.com/bulentmacka/myrepo/master/tuik.json')
    const data = await response.json()
    return data
}


deleteLastRow = () => {

    const allowances = document.querySelector('#allowances')

    const rows = allowances.querySelectorAll('tr')
    rows.item(rows.length - 1).remove()


}


deleteAllRows = () => {

    const allowances = document.querySelector('#allowances')

    const rows = allowances.querySelectorAll('tr')

    Array.from(rows).map((row,index) => rows.item(index).remove())
 


}

showColumn = (type)=>{

    const table = document.querySelector('#containerAllowance').querySelector('table')
    const tbody = table.querySelector('tbody')
    const columns = Array.from(tbody.querySelectorAll('td'))
    const aColumns = columns.filter (c => c.getAttribute('type') == 'allowance')
    const sColumns = columns.filter (c => c.getAttribute('type') == 'spending')
    const bColumns = columns.filter (c => c.getAttribute('type') == 'B')
    //console.log(aColumns)

    if (type == 'allowance') {        

        Array.from(aColumns).map(column => column.style.display = 'block')
        Array.from(sColumns).map(column => column.style.display = 'none')
        Array.from(bColumns).map(column => column.style.display = 'none')
    

    } else if (type == 'spending') {

        Array.from(aColumns).map(column => column.style.display = 'none')
        Array.from(sColumns).map(column => column.style.display = 'block')
        Array.from(bColumns).map(column => column.style.display = 'none')

    } else {

        Array.from(aColumns).map(column => column.style.display = 'none')
        Array.from(sColumns).map(column => column.style.display = 'none')
        Array.from(bColumns).map(column => column.style.display = 'block')

    }
        


}


getFF = (data) => {

    let result = 0.0
    data.map(item => {

        result += parseFloat(item.ff)

    })

    return result
}


calcPd = async(data) => {

    const tuikData = Array.from(await getTuik())
    const endeksBase =  tuikData.find(e => e.YIL == data.file.baseYear && e.AY == data.file.baseMonth)
    const ufe0 = endeksBase.EndeksA
    const ufe23 = endeksBase.EndeksB1
    const ufe24 = endeksBase.EndeksB2
    const ufe19 = endeksBase.EndeksB3
    const ufe16 = endeksBase.EndeksB4
    const ufe1 = endeksBase.EndeksB5
    const ufe28 = endeksBase.EndeksC

    let analiz = []

    data.spendings.map(spending => {

        let spendingFF = 0.0

        let _spending = spending.amount

        const _spendingEndeks = tuikData.find(e=>e.YIL == spending.year && e.AY == spending.month)   

        let an = 0.0

        if (_spending > 0) {

            let analizRow = { spending:spending, 
                              allowances:[]                                           
                            }                            
               
                data.allowances.map(allowance => {

                    const _allowanceEndeks = tuikData.find(e=>e.YIL == allowance.year && e.AY == allowance.month)

                    if (_spendingEndeks != 'undefined'){

                            let _allowance = allowance.amount - allowance.spending
                            
                            if (_spending >= _allowance) {
                                an = _allowance
                                _spending -= _allowance;
                                allowance.spending = allowance.amount
                            } else {

                                an = _spending;
                                _spending = 0;
                                allowance.spending += an;
                            }

                    if (an > 0) {

                            const spendingMonthValue = 12 * spending.year + spending.month
                            const allowanceMonthValue = 12 * allowance.year + allowance.month

                            const ufe01 = _spendingEndeks.EndeksA
                            const ufe02 = _allowanceEndeks != 'undefined' ? _allowanceEndeks.EndeksA : 0
                            let ufe0n = spendingMonthValue < allowanceMonthValue ?  ufe01 : Math.min(ufe01, ufe02)                          
                                            
                            const ufe231 = _spendingEndeks.EndeksB1
                            const ufe232 = _allowanceEndeks != 'undefined' ? _allowanceEndeks.EndeksB1 : 0
                            let ufe23n = spendingMonthValue < allowanceMonthValue ? ufe231 : Math.min(ufe231, ufe232)
                                                   
                            const ufe241 = _spendingEndeks.EndeksB2
                            const ufe242 = _allowanceEndeks != 'undefined' ? _allowanceEndeks.EndeksB2 : 0
                            let ufe24n = spendingMonthValue < allowanceMonthValue ? ufe241 : Math.min(ufe241, ufe242)
                                                    
                            const ufe191 = _spendingEndeks.EndeksB3
                            const ufe192 = _allowanceEndeks != 'undefined' ? _allowanceEndeks.EndeksB3 : 0
                            let ufe19n = spendingMonthValue < allowanceMonthValue ? ufe191 : Math.min(ufe191, ufe192)                         
                    
                            const ufe161 = _spendingEndeks.EndeksB4
                            const ufe162 = _allowanceEndeks != 'undefined' ? _allowanceEndeks.EndeksB4 : 0
                            let ufe16n = spendingMonthValue < allowanceMonthValue ? ufe161 : Math.min(ufe161, ufe162)
                                                
                            const ufe11 = _spendingEndeks.EndeksB5
                            const ufe12 = _allowanceEndeks != 'undefined' ? _allowanceEndeks.EndeksB5 : 0
                            let ufe1n = spendingMonthValue < allowanceMonthValue ? ufe11 : Math.min(ufe11, ufe12)                                
                    
                            const ufe281 = _spendingEndeks.EndeksC
                            const ufe282 = _allowanceEndeks != 'undefined' ? _allowanceEndeks.EndeksC : 0
                            let ufe28n =  spendingMonthValue < allowanceMonthValue ? ufe281 : Math.min(ufe281, ufe282)
                                              
                            const Pn =  data.file.a * ufe0n / ufe0 +
                                        data.file.b1 * ufe23n / ufe23 +
                                        data.file.b2 * ufe24n / ufe24 +
                                        data.file.b3 * ufe19n / ufe19 +
                                        data.file.b4 * ufe16n / ufe16 +
                                        data.file.b5 * ufe1n / ufe1 + 
                                        data.file.c * ufe28n / ufe28
                            
                            const PnFormula = ` ${data.file.a} x ${ufe0n} / ${ufe0} +
                                                ${data.file.b1} x ${ufe23n} / ${ufe23} +
                                                ${data.file.b2} x ${ufe24n} / ${ufe24} +
                                                ${data.file.b3} x ${ufe19n} / ${ufe19} +
                                                ${data.file.b4} x ${ufe16n} / ${ufe16} +
                                                ${data.file.b5} x ${ufe1n} / ${ufe1} +
                                                ${data.file.c} x ${ufe28n} / ${ufe28}`

                            
                            const allowanceFF = an * spending.B * (Pn - 1)
                            spendingFF += allowanceFF


                            analizRow.allowances.push({ allowance:allowance,                                             
                                                        an:an,                                             
                                                        pn:Pn,  
                                                        pnFormula:PnFormula,             
                                                        ff:allowanceFF})
                    }
                            analizRow.spending.ff = spendingFF                                

                    }
                })  
                
                analiz.push(analizRow)


    } 
})

    console.log(analiz)
    const file = JSON.parse(document.querySelector('#calcButton').getAttribute('file'))
    getResultTable(file,analiz)

}



getResultTable = (file,analiz) => {

    const printName = document.querySelector('#printName')    

    printName.innerText = file.name
    
    const table = document.querySelector('#containerFF').querySelector('table')

    const tbody = table.querySelector('tbody')  

    const summaryFF = analiz.reduce((acc,value)=> acc + value.spending.ff,0)

    let html = `<tr class="row m-0">

                            <td class="col-12">

                                <div class="row">
                                
                                    <div class="col-8"><b>TOPLAM FİYAT FARKI</b></div>

                                    <div class="col-4 text-end"><b>${formatter.format(parseFloat(summaryFF))}</b></div>

                                </div>
                            
                            
                            </td>                            

                </tr>`
    
    analiz.map(a => {

            let content = `<div class="row bg-light">

                                    <div class="col-8">

                                    <b>${a.spending.year} ${monthNames[a.spending.month - 1]} Ayı Fiyat Farkı </b>              
                                    
                                    </div>

                                    <div class="col-4 text-end">

                                    <b> ${formatter.format( parseFloat(a.spending.ff))} </b> 
                                    
                                    </div>
                
                            </div>`

            html += `<tr class="row m-0 bg-light">
                            <td class="col-12 bg-light">                             
                                    ${content}
                            </td>      
                    </tr>`

                a.allowances.map(al => {

                    const spendingMonthCount = 12 * a.spending.year + a.spending.month
                    const allowanceMonthCount = 12 * al.allowance.year + al.allowance.month
                    const textColor = spendingMonthCount > allowanceMonthCount ? 'text-danger' : 'text-dark'

                   content = `<div class="row text-end ${textColor}">

                                <div class="col-12">

                                       <p class="m-0"><i>${al.allowance.year} ${monthNames[al.allowance.month - 1]} Ödeneğinden</i> </p>
                                       <p class="m-0"><i>An = ${formatter.format(al.an)}</i></p>
                                       <p class="m-0"><i>Pn = ${al.pnFormula}</i></p>
                                       <p class="m-0"><i>Pn = ${al.pn.toFixed(6)}</i></p>
                                       <p class="m-0"><i>F =  ${formatter.format(al.an)} x ${a.spending.B} x (${al.pn.toFixed(6) } - 1) = ${formatter.format(al.ff)}</i></p>
                                
                                </div>
                   
                            </div>`

                            html += `<tr class="row m-0 text-end">
                                        <td class="col-12 text-end ">                             
                                                ${content}
                                        </td>      
                                     </tr>` 


                })               
 
   
 
    })        
     
    tbody.innerHTML = analiz.length > 0 ? html : '' 

    //console.log(analiz)

    //console.log('TOPLAM',analiz.filter(a => a.type == 'spending').reduce((acc,value)=> {return acc+value.ff},0))


}

getAllowanceRows = ()=> {

    const containerAllowance = document.querySelector('#containerAllowance')
    const table = containerAllowance.querySelector('table')
    const tbody = table.querySelector('tbody')
    const rows = tbody.querySelectorAll('tr')

    return Array.from(rows)

}

 amountOnFocus = (input)=>{

    input.value = input.value.split('.').join('')
    //console.log(input.value)

 }

 amountOnBlur = (input)=>{

    const formatter = new Intl.NumberFormat('tr-TR', {
        style: 'decimal',                
        minimumFractionDigits: 2,
      })  

      const value = input.value.replace(',','.')
      //console.log(value)
        input.value = formatter.format(parseFloat(value))

 }


 showOrHideMenuButtons=(id)=>{

        if (id == 1) {
            createFileButton.classList.replace('d-none','d-inline') 
            filesButton.classList.replace('d-inline','d-none')  
            fileButton.classList.replace('d-inline','d-none')  
            allowanceButton.classList.replace('d-inline','d-none')  
            spendingButton.classList.replace('d-inline','d-none')
            bButton.classList.replace('d-inline','d-none')
            calcButton.classList.replace('d-inline','d-none')     

            //createFileButton.style.display = 'inline'            
            // filesButton.style.display = 'none'
            // fileButton.style.display = 'none'
            // allowanceButton.style.display = 'none'
            // spendingButton.style.display = 'none'
            // calcButton.style.display = 'none'
        

        } else {

            createFileButton.classList.replace('d-inline','d-none') 
            filesButton.classList.replace('d-none','d-inline')  
            fileButton.classList.replace('d-none','d-inline')  
            allowanceButton.classList.replace('d-none','d-inline')  
            spendingButton.classList.replace('d-none','d-inline')
            bButton.classList.replace('d-none','d-inline')
            calcButton.classList.replace('d-none','d-inline')

            // createFileButton.style.display = 'none'
            // filesButton.style.display = 'inline'
            // fileButton.style.display = 'inline'
            // allowanceButton.style.display = 'inline'
            // spendingButton.style.display = 'inline'
            // calcButton.style.display = 'inline'

        }

 }

 DownloadFiles = ()=> {

    const dbFile = indexedDB.open('yiffDb',1)    

    dbFile.onsuccess = (event) => {        

        const db = event.target.result

        const fileStore = db.transaction('files','readonly').objectStore('files')                

        fileStore.getAll().onsuccess = (event) => {    

            const files = event.target.result  
            
            const amountStore = db.transaction('amounts','readonly').objectStore('amounts')

            const indexFile = amountStore.index('fileId')

                amountStore.getAll().onsuccess =(event)=> {

                    const amounts = event.target.result                          

                    const file = new File([JSON.stringify({files:files,amounts:amounts})], 'yiff.json', {type: 'text/plain'})
                    
                    const url = URL.createObjectURL(file)   
                    
                    var a = document.createElement("a");
                    a.style = "display: none";
                    a.href = url;
                    a.download = file.name;
                    a.click();

                    window.URL.revokeObjectURL(url)
    
                }                                   
            
        }
    }

 }


