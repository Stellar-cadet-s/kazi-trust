//! Kazi Trust Escrow - Soroban smart contract
//! Holds funds from employer until work is completed, then releases to employee.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Vec,
};

const KEY_ESCROW_DATA: Symbol = symbol_short!("EscrowData");
const KEY_TOTAL_BALANCE: Symbol = symbol_short!("Balance");

#[contracttype]
#[derive(Clone, Debug)]
pub struct EscrowData {
    pub employer: Address,
    pub beneficiary: Option<Address>,
    pub asset: Address,
}

#[contract]
pub struct KaziEscrow;

#[contractimpl]
impl KaziEscrow {
    /// Create a new escrow slot. Employer can then deposit; beneficiary set when job assigned.
    pub fn create(env: Env, escrow_id: Symbol, employer: Address, asset: Address) {
        employer.require_auth();
        let data = EscrowData {
            employer: employer.clone(),
            beneficiary: None,
            asset: asset.clone(),
        };
        env.storage()
            .instance()
            .set(&(KEY_ESCROW_DATA, escrow_id.clone()), &data);
        env.storage()
            .instance()
            .set(&(KEY_TOTAL_BALANCE, escrow_id), &0_i128);
        env.storage().instance().extend_ttl(100, 5000);
    }

    /// Deposit (hold) funds into escrow. Called after M-Pesa deposit; employer must approve transfer.
    pub fn deposit(env: Env, escrow_id: Symbol, from: Address, amount: i128) {
        from.require_auth();
        let key_data = (KEY_ESCROW_DATA, escrow_id.clone());
        let key_bal = (KEY_TOTAL_BALANCE, escrow_id.clone());
        let data: EscrowData = env
            .storage()
            .instance()
            .get(&key_data)
            .unwrap_or_else(|| panic!("escrow not found"));
        assert!(data.employer == from, "only employer can deposit");
        assert!(amount > 0, "amount must be positive");

        let asset = soroban_sdk::token::Client::new(&env, &data.asset);
        asset.transfer(&from, &env.current_contract_address(), &amount);

        let current: i128 = env.storage().instance().get(&key_bal).unwrap_or(0);
        env.storage().instance().set(&key_bal, &(current + amount));
        env.storage().instance().extend_ttl(100, 5000);
    }

    /// Set beneficiary (employee). Only employer can set.
    pub fn set_beneficiary(env: Env, escrow_id: Symbol, beneficiary: Address) {
        let key_data = (KEY_ESCROW_DATA, escrow_id.clone());
        let data: EscrowData = env
            .storage()
            .instance()
            .get(&key_data)
            .unwrap_or_else(|| panic!("escrow not found"));
        data.employer.require_auth();

        let new_data = EscrowData {
            beneficiary: Some(beneficiary),
            ..data
        };
        env.storage().instance().set(&key_data, &new_data);
        env.storage().instance().extend_ttl(100, 5000);
    }

    /// Release (withdraw) all held funds to the beneficiary. Employer must authorize (work complete).
    pub fn release(env: Env, escrow_id: Symbol) {
        let key_data = (KEY_ESCROW_DATA, escrow_id.clone());
        let key_bal = (KEY_TOTAL_BALANCE, escrow_id.clone());
        let data: EscrowData = env
            .storage()
            .instance()
            .get(&key_data)
            .unwrap_or_else(|| panic!("escrow not found"));
        data.employer.require_auth();

        let beneficiary = data
            .beneficiary
            .unwrap_or_else(|| panic!("beneficiary not set"));
        let amount: i128 = env.storage().instance().get(&key_bal).unwrap_or(0);
        assert!(amount > 0, "nothing to release");

        env.storage().instance().set(&key_bal, &0_i128);

        let contract_addr = env.current_contract_address();
        let asset = soroban_sdk::token::Client::new(&env, &data.asset);
        asset.transfer(&contract_addr, &beneficiary, &amount);
        env.storage().instance().extend_ttl(100, 5000);
    }

    /// Return current balance held in escrow.
    pub fn balance(env: Env, escrow_id: Symbol) -> i128 {
        let key_bal = (KEY_TOTAL_BALANCE, escrow_id);
        env.storage().instance().get(&key_bal).unwrap_or(0)
    }

    /// Get escrow data (employer, beneficiary, asset).
    pub fn get_escrow(env: Env, escrow_id: Symbol) -> EscrowData {
        let key_data = (KEY_ESCROW_DATA, escrow_id);
        env.storage()
            .instance()
            .get(&key_data)
            .unwrap_or_else(|| panic!("escrow not found"))
    }
}
