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
    firm_data: {gst firm data: {}}
    token:
    // and rest other necessary things
}

login as non-gst firm sends: {
    is_admin: true/false
    common firm data,
    firm_data: {non-gst firm data: {}}
    token:
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
