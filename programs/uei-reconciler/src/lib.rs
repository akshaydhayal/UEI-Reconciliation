use anchor_lang::prelude::*;

declare_id!("641qWLZWuox4J9FMxNFEhEyyAStLopfHwWE97fTdj8av");

#[program]
pub mod energy_storage {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, storage_fee: u64) -> Result<()> {
        let battery_bank = &mut ctx.accounts.battery_bank;
        battery_bank.owner = ctx.accounts.owner.key();
        battery_bank.storage_fee = storage_fee;
        Ok(())
    }

    pub fn store_energy(ctx: Context<StoreEnergy>, amount: u64, rate: u64) -> Result<()> {
        let battery_bank = &ctx.accounts.battery_bank;
        let producer_account = &mut ctx.accounts.producer_account;
        
        producer_account.stored_amount += amount;
        producer_account.rate = rate;
        
        // Record the transaction
        let tx = Transaction {
            tx_type: TransactionType::Store,
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        };
        producer_account.transactions.push(tx);
        
        // Automatic reconciliation
        reconcile(producer_account, battery_bank.storage_fee);
        
        Ok(())
    }

    pub fn consume_energy(ctx: Context<ConsumeEnergy>, amount: u64) -> Result<()> {
        let battery_bank = &ctx.accounts.battery_bank;
        let producer_account = &mut ctx.accounts.producer_account;
        
        require!(producer_account.stored_amount >= amount, EnergyStorageError::InsufficientEnergy);
        producer_account.consumed_amount += amount;
        
        // Record the transaction
        let tx = Transaction {
            tx_type: TransactionType::Consume,
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        };
        producer_account.transactions.push(tx);
        
        // Automatic reconciliation
        reconcile(producer_account, battery_bank.storage_fee);
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = owner, space = 8 + 32 + 8)]
    pub battery_bank: Account<'info, BatteryBank>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StoreEnergy<'info> {
    pub battery_bank: Account<'info, BatteryBank>,
    #[account(
        init_if_needed,
        payer = producer,
        space = 8 + 32 + 8 + 8 + 8 + 8 + 8 + 4 + (50 * (1 + 8 + 8)), // Assuming max 50 transactions
        seeds = [b"producer", battery_bank.key().as_ref(), producer.key().as_ref()],
        bump
    )]
    pub producer_account: Account<'info, ProducerAccount>,
    #[account(mut)]
    pub producer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConsumeEnergy<'info> {
    pub battery_bank: Account<'info, BatteryBank>,
    #[account(mut)]
    pub producer_account: Account<'info, ProducerAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[account]
pub struct BatteryBank {
    pub owner: Pubkey,
    pub storage_fee: u64,
}

#[account]
pub struct ProducerAccount {
    pub producer: Pubkey,
    pub stored_amount: u64,
    pub consumed_amount: u64,
    pub rate: u64,
    pub balance: i64,
    pub last_reconciled: i64,
    pub transactions: Vec<Transaction>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum TransactionType {
    Store,
    Consume,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct Transaction {
    pub tx_type: TransactionType,
    pub amount: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum EnergyStorageError {
    #[msg("Insufficient energy stored")]
    InsufficientEnergy,
}

// Helper function for reconciliation
fn reconcile(producer_account: &mut ProducerAccount, storage_fee: u64) {
    let storage_charge = producer_account.stored_amount * storage_fee;
    let consumption_charge = producer_account.consumed_amount * producer_account.rate;
    
    producer_account.balance = (storage_charge as i64) - (consumption_charge as i64);
    producer_account.last_reconciled = Clock::get().unwrap().unix_timestamp;
}





// use anchor_lang::prelude::*;

// declare_id!("641qWLZWuox4J9FMxNFEhEyyAStLopfHwWE97fTdj8av");

// #[program]
// pub mod energy_storage {
//     use super::*;

//     pub fn initialize(ctx: Context<Initialize>, storage_fee: u64) -> Result<()> {
//         let battery_bank = &mut ctx.accounts.battery_bank;
//         battery_bank.owner = ctx.accounts.owner.key();
//         battery_bank.storage_fee = storage_fee;
//         Ok(())
//     }

//     pub fn store_energy(ctx: Context<StoreEnergy>, amount: u64, rate: u64) -> Result<()> {
//         let battery_bank = &ctx.accounts.battery_bank;
//         let producer_account = &mut ctx.accounts.producer_account;
        
//         producer_account.stored_amount += amount;
//         producer_account.rate = rate;
        
//         // Record the transaction
//         let tx = Transaction {
//             tx_type: TransactionType::Store,
//             amount,
//             timestamp: Clock::get()?.unix_timestamp,
//         };
//         producer_account.transactions.push(tx);
        
//         // Automatic reconciliation
//         reconcile(producer_account, battery_bank.storage_fee);
        
//         Ok(())
//     }

//     pub fn consume_energy(ctx: Context<ConsumeEnergy>, amount: u64) -> Result<()> {
//         let battery_bank = &ctx.accounts.battery_bank;
//         let producer_account = &mut ctx.accounts.producer_account;
        
//         require!(producer_account.stored_amount >= amount, EnergyStorageError::InsufficientEnergy);
//         producer_account.consumed_amount += amount;
        
//         // Record the transaction
//         let tx = Transaction {
//             tx_type: TransactionType::Consume,
//             amount,
//             timestamp: Clock::get()?.unix_timestamp,
//         };
//         producer_account.transactions.push(tx);
        
//         // Automatic reconciliation
//         reconcile(producer_account, battery_bank.storage_fee);
        
//         Ok(())
//     }
// }

// #[derive(Accounts)]
// pub struct Initialize<'info> {
//     #[account(init, payer = owner, space = 8 + 32 + 8)]
//     pub battery_bank: Account<'info, BatteryBank>,
//     #[account(mut)]
//     pub owner: Signer<'info>,
//     pub system_program: Program<'info, System>,
// }

// #[derive(Accounts)]
// pub struct StoreEnergy<'info> {
//     pub battery_bank: Account<'info, BatteryBank>,
//     #[account(
//         init_if_needed,
//         payer = producer,
//         space = 8 + 32 + 8 + 8 + 8 + 8 + 8 + 4 + (50 * (1 + 8 + 8)), // Assuming max 50 transactions
//         seeds = [b"producer", battery_bank.key().as_ref(), producer.key().as_ref()],
//         bump
//     )]
//     pub producer_account: Account<'info, ProducerAccount>,
//     #[account(mut)]
//     pub producer: Signer<'info>,
//     pub system_program: Program<'info, System>,
// }


// #[derive(Accounts)]
// pub struct ConsumeEnergy<'info> {
//     pub battery_bank: Account<'info, BatteryBank>,
//     #[account(mut)]
//     pub producer_account: Account<'info, ProducerAccount>,
//     #[account(mut)]
//     pub owner: Signer<'info>,
// }

// #[account]
// pub struct BatteryBank {
//     pub owner: Pubkey,
//     pub storage_fee: u64,
// }

// #[account]
// pub struct ProducerAccount {
//     pub producer: Pubkey,
//     pub stored_amount: u64,
//     pub consumed_amount: u64,
//     pub rate: u64,
//     pub balance: i64,
//     pub last_reconciled: i64,
//     pub transactions: Vec<Transaction>,
// }

// #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
// pub enum TransactionType {
//     Store,
//     Consume,
// }

// #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
// pub struct Transaction {
//     pub tx_type: TransactionType,
//     pub amount: u64,
//     pub timestamp: i64,
// }

// #[error_code]
// pub enum EnergyStorageError {
//     #[msg("Insufficient energy stored")]
//     InsufficientEnergy,
// }

// // Helper function for reconciliation
// fn reconcile(producer_account: &mut ProducerAccount, storage_fee: u64) {
//     let storage_charge = producer_account.stored_amount * storage_fee;
//     let consumption_charge = producer_account.consumed_amount * producer_account.rate;
    
//     producer_account.balance = (storage_charge as i64) - (consumption_charge as i64);
//     producer_account.last_reconciled = Clock::get().unwrap().unix_timestamp;
// }