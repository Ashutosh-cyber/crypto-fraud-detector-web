// Friendly name + plain-English description for every model feature.
// Used by the auto-filled defaults panel and the results table so users
// never see raw machine column names like `fees_as_share_total`.
//
// A "block" is a batch of Bitcoin transactions created ~every 10 minutes.
// A "period" (time step) is a 2-week window used by the dataset.
export const FEATURE_INFO = {
  // --- Fees ---
  fees_min: {
    name: 'Smallest Transaction Fee',
    desc: 'The lowest fee this wallet ever paid to send Bitcoin (in satoshis). Fraud wallets often pay unusually low fees.',
  },
  fees_max: {
    name: 'Largest Transaction Fee',
    desc: 'The highest fee this wallet ever paid in a single transaction (in satoshis).',
  },
  fees_total: {
    name: 'Total Fees Ever Paid',
    desc: 'Every transaction fee this wallet has paid, added together (in satoshis).',
  },
  fees_as_share_total: {
    name: 'Total Fees as Share of Value',
    desc: 'All fees combined, expressed as a fraction of the total Bitcoin this wallet moved.',
  },
  fees_as_share_max: {
    name: 'Highest Fee Share',
    desc: 'The largest fee as a fraction of a single transaction’s value.',
  },
  fees_as_share_min: {
    name: 'Lowest Fee Share',
    desc: 'The smallest fee as a fraction of a single transaction’s value.',
  },

  // --- Timing ---
  first_sent_block: {
    name: 'First Time It Sent Bitcoin',
    desc: 'The block number when this wallet first sent Bitcoin. Higher number = more recent.',
  },
  first_received_block: {
    name: 'First Time It Received Bitcoin',
    desc: 'The block number when this wallet first received Bitcoin.',
  },
  first_block_appeared_in: {
    name: 'First Seen on Blockchain',
    desc: 'The block where this wallet first showed up at all.',
  },
  last_block_appeared_in: {
    name: 'Last Seen on Blockchain',
    desc: 'The most recent block where this wallet was active.',
  },

  // --- Span ---
  lifetime_in_blocks: {
    name: 'How Long the Wallet Existed',
    desc: 'Blocks between the wallet’s first and last activity. ~144 blocks = 1 day. Short-lived wallets are more suspicious.',
  },
  num_timesteps_appeared_in: {
    name: 'Active Periods',
    desc: 'How many 2-week periods the wallet did anything. Most fraud wallets appear in just one or two.',
  },

  // --- Diversity ---
  transacted_w_address_total: {
    name: 'Total Counterpart Wallets',
    desc: 'How many different wallets it sent to or received from. Fraud wallets often deal with very few.',
  },
  transacted_w_address_mean: {
    name: 'Avg Counterparts per Period',
    desc: 'Average number of distinct wallets it dealt with in each active period.',
  },
  transacted_w_address_max: {
    name: 'Most Counterparts in a Period',
    desc: 'The highest number of distinct wallets it dealt with in any single period.',
  },
  transacted_w_address_min: {
    name: 'Fewest Counterparts in a Period',
    desc: 'The lowest number of distinct wallets it dealt with in any single period.',
  },
  num_addr_transacted_multiple: {
    name: 'Repeat Counterparts',
    desc: 'How many wallets it dealt with more than once — a sign of an ongoing relationship.',
  },

  // --- Amounts ---
  total_txs: {
    name: 'Total Transactions',
    desc: 'Total number of transactions this wallet took part in.',
  },
  num_txs_as_sender: {
    name: 'Times It Sent Money',
    desc: 'Number of transactions where this wallet was the sender.',
  },
  'num_txs_as receiver': {
    name: 'Times It Received Money',
    desc: 'Number of transactions where this wallet was the receiver.',
  },
  btc_transacted_total: {
    name: 'Total Bitcoin Moved',
    desc: 'All Bitcoin sent and received, added together.',
  },
  btc_transacted_max: {
    name: 'Largest Transaction Amount',
    desc: 'The biggest single transaction amount (sent or received).',
  },
  btc_transacted_min: {
    name: 'Smallest Transaction Amount',
    desc: 'The smallest single transaction amount.',
  },
  btc_sent_max: {
    name: 'Largest Amount Sent',
    desc: 'The biggest single amount of Bitcoin this wallet sent.',
  },
  btc_sent_mean: {
    name: 'Average Amount Sent',
    desc: 'Typical amount of Bitcoin sent per transaction.',
  },
  btc_sent_min: {
    name: 'Smallest Amount Sent',
    desc: 'The smallest amount of Bitcoin it ever sent.',
  },
  btc_received_max: {
    name: 'Largest Amount Received',
    desc: 'The biggest single amount of Bitcoin it received.',
  },
  btc_received_mean: {
    name: 'Average Amount Received',
    desc: 'Typical amount of Bitcoin received per transaction.',
  },
  btc_received_min: {
    name: 'Smallest Amount Received',
    desc: 'The smallest amount of Bitcoin it ever received.',
  },

  // --- Cadence (timing rhythm of transactions) ---
  blocks_btwn_txs_max: {
    name: 'Longest Gap Between Transactions',
    desc: 'Most blocks that passed between two of its transactions.',
  },
  blocks_btwn_txs_mean: {
    name: 'Average Gap Between Transactions',
    desc: 'Typical number of blocks between its transactions.',
  },
  blocks_btwn_txs_min: {
    name: 'Shortest Gap Between Transactions',
    desc: 'Fewest blocks between two of its transactions.',
  },
  blocks_btwn_output_txs_min: {
    name: 'Shortest Gap Between Outgoing Txs',
    desc: 'Fewest blocks between two outgoing (spending) transactions.',
  },
  blocks_btwn_output_txs_mean: {
    name: 'Avg Gap Between Outgoing Txs',
    desc: 'Typical number of blocks between outgoing transactions.',
  },
  blocks_btwn_output_txs_max: {
    name: 'Longest Gap Between Outgoing Txs',
    desc: 'Most blocks between two outgoing transactions.',
  },
  blocks_btwn_output_txs_total: {
    name: 'Total Span of Outgoing Txs',
    desc: 'Total blocks spanned by all outgoing transactions.',
  },
  blocks_btwn_input_txs_min: {
    name: 'Shortest Gap Between Incoming Txs',
    desc: 'Fewest blocks between two incoming (receiving) transactions.',
  },
  blocks_btwn_input_txs_max: {
    name: 'Longest Gap Between Incoming Txs',
    desc: 'Most blocks between two incoming transactions.',
  },
  blocks_btwn_input_txs_total: {
    name: 'Total Span of Incoming Txs',
    desc: 'Total blocks spanned by all incoming transactions.',
  },
}

export function featureName(key) {
  return FEATURE_INFO[key]?.name ?? key
}

export function featureDesc(key) {
  return FEATURE_INFO[key]?.desc ?? ''
}
