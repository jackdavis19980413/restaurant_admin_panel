import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PostAddIcon from '@mui/icons-material/PostAdd';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';

import { Service } from '../../utils/info';
import AddPanel from './add';
import EditPanel from './edit';
import DeletePanel from './delete';

import { useTranslation } from 'next-i18next';
import { convertDateTime } from '@/utils/http_helper';
import { useRouter } from 'next/router';

interface TablePaginationActionsProps {
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (
        event: React.MouseEvent<HTMLButtonElement>,
        newPage: number,
    ) => void;
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
    },
}));

function TablePaginationActions(props: TablePaginationActionsProps) {
    const theme = useTheme();
    const { count, page, rowsPerPage, onPageChange } = props;

    const handleFirstPageButtonClick = (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        onPageChange(event, 0);
    };

    const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onPageChange(event, page - 1);
    };

    const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onPageChange(event, page + 1);
    };

    const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
    };

    return (
        <Box sx={{ flexShrink: 0, ml: 2.5 }}>
            <IconButton
                onClick={handleFirstPageButtonClick}
                disabled={page === 0}
                aria-label="first page"
            >
                {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
            </IconButton>
            <IconButton
                onClick={handleBackButtonClick}
                disabled={page === 0}
                aria-label="previous page"
            >
                {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
            </IconButton>
            <IconButton
                onClick={handleNextButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="next page"
            >
                {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
            </IconButton>
            <IconButton
                onClick={handleLastPageButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="last page"
            >
                {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
            </IconButton>
        </Box>
    );
}

interface TableProps {
    rows: Service[];
}

export default function Page({ rows }: TableProps) {
    const { t } = useTranslation('common')

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const [rowsData, setRows] = React.useState(rows);
    const [view, setView] = React.useState('hide'); // can be 'hide', 'add', 'edit', delete
    const [editItem, setEditItem] = React.useState<Service | null>(null);

    const router = useRouter();
    const { locale } = router;

    React.useEffect(() => {
        setRows(rows);
    }, [rows]);

    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows =
        page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rowsData?.length) : 0;

    const handleChangePage = (
        event: React.MouseEvent<HTMLButtonElement> | null,
        newPage: number,
    ) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleBackClick = () => {
        setView('hide');
        setEditItem(null);
    };

    const handleSaveClick = (data: Service) => {
        rowsData?.find(x => x.service_id === data.service_id) ?
            setRows(rowsData => rowsData?.map(x => x.service_id === data.service_id ? data : x))
            : setRows([...rowsData, data])
        setView('hide');
    };

    const handleAddClick = () => {
        setView('add');
    };

    const handleEditClick = (item: Service) => {
        setEditItem(item);
        setView('edit');
    };

    const handleDeleteClick = (item: Service) => {
        setEditItem(item);
        setView('delete');
    };

    const handleDeleteReq = (data: Service) => {
        const index = rowsData?.indexOf(data)
        if (index !== -1) rowsData?.splice(index, 1);
        setRows(rowsData?.filter(row => row !== data))
    }

    return (
        <TableContainer component={Paper}>
            <Table sx={{ tableLayout: 'fixed' }} aria-label="custom pagination table">
                <TableHead>
                    <TableRow>
                        <StyledTableCell>{t('name')}</StyledTableCell>
                        <StyledTableCell sx={{ width: 200 }} align="right">{t('created_at')}</StyledTableCell>
                        <StyledTableCell sx={{ width: 160 }}>
                            <IconButton aria-label="add"
                                color="info"
                                onClick={handleAddClick}
                            >
                                <PostAddIcon />
                            </IconButton>
                        </StyledTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {view === 'add' && (
                        <AddPanel onBack={handleBackClick} onSave={handleSaveClick} />
                    )}
                    {(rowsPerPage > 0 && rowsData
                        ? rowsData?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        : rowsData
                    )?.map((row) => (
                        view === 'edit' && editItem?.service_id === row?.service_id ? (
                            <EditPanel
                                row={row}
                                onBack={handleBackClick}
                                onSave={handleSaveClick}
                            />
                        ) : view === 'delete' && editItem?.service_id === row?.service_id ? (
                            <DeletePanel
                                row={row}
                                onBack={handleBackClick}
                                onDelete={handleDeleteReq}
                            />
                        ) : (
                            <TableRow key={row?.service_id}>
                                <TableCell component="th" scope="row">
                                    {locale === 'en' ? row?.service_en_name :
                                        locale === 'zh' ? row?.service_zh_name :
                                            locale === 'ko' ? row?.service_ko_name :
                                                row?.service_name}
                                </TableCell>
                                <TableCell style={{ width: 160 }} align="right">
                                    {convertDateTime(row?.created_at)}
                                </TableCell>
                                <TableCell style={{ width: 160 }}>
                                    <IconButton
                                        aria-label="edit"
                                        color="primary"
                                        onClick={() => handleEditClick(row)}
                                        disabled={!row?.service_id}
                                        sx={{ mr: 1 }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        aria-label="delete"
                                        color="error"
                                        onClick={() => handleDeleteClick(row)}
                                        disabled={!row?.service_id}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        )
                    ))}
                    {emptyRows > 0 && (
                        <TableRow style={{ height: 53 * emptyRows }}>
                            <TableCell colSpan={3} />
                        </TableRow>
                    )}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                            colSpan={3}
                            count={rowsData?.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            slotProps={{
                                select: {
                                    inputProps: {
                                        'aria-label': t('rows_per_page'),
                                    },
                                    native: true,
                                },
                            }}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            ActionsComponent={TablePaginationActions}
                        />
                    </TableRow>
                </TableFooter>
            </Table>
        </TableContainer>
    );
}