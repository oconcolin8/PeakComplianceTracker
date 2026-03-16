import React from 'react';
import Modal from './Modal.jsx';

export default function ConfirmDialog({ title, message, onConfirm, onCancel, danger = true, loading = false }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>
            {loading ? 'Please wait…' : 'Confirm'}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
