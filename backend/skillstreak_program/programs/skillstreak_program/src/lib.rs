use anchor_lang::prelude::*;

declare_id!("7LeARRwbauXQ1W4Cr22ZEyPUVP5wHqYijXvkvPaVpguP");

#[program]
pub mod skillstreak_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
