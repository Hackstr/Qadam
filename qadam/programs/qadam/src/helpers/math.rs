use crate::errors::QadamError;
use anchor_lang::prelude::*;

/// Safe multiply then divide using u128 intermediate to prevent overflow.
/// result = (a * b) / c
pub fn mul_div(a: u64, b: u64, c: u64) -> Result<u64> {
    require!(c > 0, QadamError::MathOverflow);
    let result = (a as u128)
        .checked_mul(b as u128)
        .ok_or(QadamError::MathOverflow)?
        .checked_div(c as u128)
        .ok_or(QadamError::MathOverflow)?;
    Ok(result as u64)
}

/// Calculate basis points: amount * bps / 10_000
pub fn bps_of(amount: u64, bps: u64) -> Result<u64> {
    mul_div(amount, bps, 10_000)
}

/// Safe addition
pub fn safe_add(a: u64, b: u64) -> Result<u64> {
    a.checked_add(b).ok_or_else(|| error!(QadamError::MathOverflow))
}

/// Safe subtraction
pub fn safe_sub(a: u64, b: u64) -> Result<u64> {
    a.checked_sub(b).ok_or_else(|| error!(QadamError::MathOverflow))
}
