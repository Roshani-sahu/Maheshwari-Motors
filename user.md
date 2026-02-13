User {
    type: "secondary" (enum ["main", "secondary"])
    common firm data,
    stock = 0,
    gst_firm {
        credentials: {username, password}
        data: {challans, bills, items, transactions}
    },
    non_gst_firm {
        credentials: {username, password}
        data: {challans, bills, items, transactions}
    },
    admin: null
}

User {
    type: "main" (enum ["main", "secondary"])
    common firm data,
    stock = 0,
    gst_firm {
        credentials: {username, password}
        data: {challans, bills, items, transactions}
    },
    non_gst_firm {
        credentials: {username, password}
        data: {challans, bills, items, transactions}
    },
    admin: {
        credentials: {username, password}
    }
}

login as gst firm sends: {
    is_admin: true/false
    common firm data,
    firm_data: {gst firm data}
    token:
    // and rest other necessary things
}

login as non-gst firm sends: {
    is_admin: true/false
    common firm data,
    firm_data: {non-gst firm data}
    token
    // and rest other necessary things
}

login as admin sends {
    is_admin: true/false,
    token:
    // and rest other necessary things which I dont think is any more
}

------------------------------------------------------

ui flow in frontend:
login > if logged in as gst/nongst firm > dashboard (containing all things)
login > if logged in as admin > user management screen only with nothing else to create/edit/delete any credentials

------------------------------------------------------

DATA SEPERATION:
common:
- items (view & manage)
- category (view & manage)
- supplier (view & manage)
- create challans // (challans can be created for gst or nongst (there will be a dropdown in every item in challans [0, 1] 0 for nongst and 1 for gst) that 0 or 1 will decide which items will go in the gst challan and which ones will go in nongst challan. so technically user created one challan and mixed gst and nongst items in it and as he presses save challan button in frontend > frontend will send all items and other details to backend > backend seperates items with 0 and 1 > creates 2 challans and saves as: [if 0 then save in nongst_firm data else if 1 then save in gst firm data])

gst firm data:
- gst transactions
- gst challans
- gst bills
- gst reports

nongst firm data:
- nongst transactions
- nongst challans
- nongst bills
- nongst reports


so to optimize my idea is to create 3 collections and add reference in each other:
- USER
- FIRM
- ADMIN

relation:
USER {
    data: { // common data
        items, categories, suppliers, etc
    }
    gst_firm: ObjectId of FIRM
    nongst_firm: ObjectId of FIRM
    admin: ObjectId of ADMIN
}

FIRM {
    type: "1" or "0" (1 for gst & 0 for nongst)
    credentials: {username, password}
    firm_info: {name, phone, address, godown address, city, state, reg no, cin, bank name, ifsc code, email, account no}
    data: {challans, bills, items, transactions}
    user: ObjectId of USER
}

ADMIN {
    credentials: {username, password}
    user: ObjectId of USER
}

-----------------------------------------------------
User {
    _id,
    type: "secondary" (enum ["main", "secondary"]),
    data: { // common data
        items, categories, suppliers, etc
    },
    stock = 0,
    gst_firm {
        credentials: {username, password}
        firm_info: {name, phone, address, godown address, city, state, reg no, cin, bank name, ifsc code, email, account no, gstin}
        data: {challans, bills, items, transactions}
    },
    non_gst_firm {
        credentials: {username, password}
        firm_info: {name, phone, address, godown address, city, state, reg no, cin, bank name, ifsc code, email, account no}
        data: {challans, bills, items, transactions}
    },
    admin: {username, password} or null
}